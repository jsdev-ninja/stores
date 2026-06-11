import { logger } from "firebase-functions/v2";
import admin from "firebase-admin";
import { FirebaseAPI, TOrder } from "@jsdev_ninja/core";
import { subscribe } from "../../../platform/eventBus";
import {
	LedgerEventTypes,
	TransactionPostedPayload,
} from "../../ledger/events";

// ---------------------------------------------------------------------------
// Type → paymentStatus mapping
// ---------------------------------------------------------------------------

type TransactionType = TransactionPostedPayload["type"];
type OrderPaymentStatus = NonNullable<TOrder["paymentStatus"]>;

/**
 * Only the transaction types we know how to map. Unknown types are ignored
 * (the guard below will log + return rather than guess).
 */
const TRANSACTION_TYPE_TO_PAYMENT_STATUS: Partial<
	Record<TransactionType, OrderPaymentStatus>
> = {
	hyp_j5_auth: "pending_j5",
	hyp_capture: "completed",
	hyp_direct: "completed",
	manual: "completed",
	// Debit types (delivery_note/invoice/...) have direction "none" and never
	// reach the mapping — the direction guard returns first. Left unmapped.
};

/**
 * Statuses considered "terminal" — we never overwrite these with a lesser one.
 */
const TERMINAL_STATUSES: ReadonlySet<OrderPaymentStatus> = new Set([
	"completed",
	"refunded",
]);

// ---------------------------------------------------------------------------
// Subscriber
// ---------------------------------------------------------------------------

export const onTransactionPostedMarkOrderPaid = subscribe(
	{
		name: "transaction-posted-mark-order-paid",
		type: LedgerEventTypes.transactionPosted,
		payloadSchema: TransactionPostedPayload,
	},
	async (event, ctx) => {
		const { payload } = event;
		const { companyId, storeId, eventId } = ctx;

		// 1. Log receipt
		logger.info("markOrderPaidOnTransactionPosted: received", {
			eventId,
			transactionId: payload.transactionId,
			reference: payload.reference,
			type: payload.type,
			direction: payload.direction,
			companyId,
			storeId,
		});

		// 2. Guard: only handle order-related transactions
		if (payload.reference?.type !== "order") {
			logger.info(
				"markOrderPaidOnTransactionPosted: reference is not an order, skipping",
				{
					eventId,
					transactionId: payload.transactionId,
					referenceType: payload.reference?.type ?? null,
				},
			);
			return;
		}

		// 3. Guard: only handle inflows (outflows / refunds handled separately)
		if (payload.direction !== "in") {
			logger.info(
				"markOrderPaidOnTransactionPosted: direction is not 'in', skipping",
				{
					eventId,
					transactionId: payload.transactionId,
					direction: payload.direction,
				},
			);
			return;
		}

		// 4. Map transaction type → order paymentStatus
		const nextStatus = TRANSACTION_TYPE_TO_PAYMENT_STATUS[payload.type];
		if (!nextStatus) {
			logger.warn(
				"markOrderPaidOnTransactionPosted: unknown transaction type, skipping",
				{
					eventId,
					transactionId: payload.transactionId,
					type: payload.type,
				},
			);
			return;
		}

		const orderId = payload.reference.id;

		// 5. Load the order
		const db = admin.firestore();
		const orderPath = FirebaseAPI.firestore.getPath({
			companyId,
			storeId,
			collectionName: "orders",
			id: orderId,
		});

		try {
			const orderSnap = await db.doc(orderPath).get();

			if (!orderSnap.exists) {
				logger.error(
					"markOrderPaidOnTransactionPosted: order not found — will retry",
					{
						eventId,
						transactionId: payload.transactionId,
						orderId,
						orderPath,
					},
				);
				throw new Error(
					`Order not found: ${orderId} (path: ${orderPath})`,
				);
			}

			const order = orderSnap.data() as TOrder;
			const currentStatus = order.paymentStatus as OrderPaymentStatus | undefined;

			// 6. Guard against downgrades / out-of-order events
			if (currentStatus && TERMINAL_STATUSES.has(currentStatus)) {
				logger.info(
					"markOrderPaidOnTransactionPosted: order already in terminal paymentStatus, skipping",
					{
						eventId,
						transactionId: payload.transactionId,
						orderId,
						currentStatus,
						wouldHaveSet: nextStatus,
					},
				);
				return;
			}

			// Idempotency: no-op if already at the target status
			if (currentStatus === nextStatus) {
				logger.info(
					"markOrderPaidOnTransactionPosted: paymentStatus already matches target, no-op",
					{
						eventId,
						transactionId: payload.transactionId,
						orderId,
						paymentStatus: nextStatus,
					},
				);
				return;
			}

			// 7. Update ONLY paymentStatus + traceability field
			await db.doc(orderPath).set(
				{
					paymentStatus: nextStatus,
					lastPaymentTransactionId: payload.transactionId,
				},
				{ merge: true },
			);

			// 8. Log success
			logger.info("markOrderPaidOnTransactionPosted: order paymentStatus updated", {
				eventId,
				transactionId: payload.transactionId,
				orderId,
				previousStatus: currentStatus ?? null,
				nextStatus,
			});

			// 9. Close the cart for a confirmed online checkout payment (J5 auth).
			// The cart was deliberately LEFT OPEN when the draft order was created
			// (see closeCartOnOrderPlaced) so the customer could go back and edit it
			// before paying. Now that payment is confirmed, close it. Best-effort:
			// a failure here must NOT fail the paymentStatus write (which would
			// needlessly retry the whole event) — so it is caught and logged.
			if (payload.type === "hyp_j5_auth" && order.cart?.id) {
				const cartPath = FirebaseAPI.firestore.getPath({
					companyId,
					storeId,
					collectionName: "cart",
					id: order.cart.id,
				});
				try {
					await db.doc(cartPath).set({ status: "completed" }, { merge: true });
					logger.info("markOrderPaidOnTransactionPosted: cart closed", {
						eventId,
						orderId,
						cartId: order.cart.id,
					});
				} catch (cartErr) {
					logger.warn("markOrderPaidOnTransactionPosted: failed to close cart", {
						eventId,
						orderId,
						cartId: order.cart.id,
						err: cartErr,
					});
				}
			}
		} catch (err) {
			logger.error("markOrderPaidOnTransactionPosted: failed", {
				eventId,
				transactionId: payload.transactionId,
				orderId,
				err,
			});
			throw err;
		}
	},
);
