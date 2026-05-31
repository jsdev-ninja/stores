import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { FirebaseAPI, TBudgetRecord, TOrder } from "@jsdev_ninja/core";
import { subscribe } from "../../../platform/eventBus";
import {
	OrderEventTypes,
	OrderCancelledPayload,
	OrderRefundedPayload,
} from "../../orders/events";
import { applyBudgetEvent } from "../services/applyBudgetEvent";
import { budgetRecordsCollectionPath } from "../internal/paths";

/**
 * Shared handler for both order.cancelled and order.refunded.
 *
 * Security invariants:
 *   - Uses a PER-ORDER dedup key ("order_reversal_{orderId}") so that if an
 *     order emits BOTH cancelled AND refunded, only the FIRST reversal writes;
 *     the second is an idempotent no-op. The dedup key is independent of the
 *     event's own eventId so both events resolve to the same marker.
 *   - Reverses the ACTUAL amount charged (from the debt_increase budgetRecord),
 *     not the current cart total. If no debt_increase record exists for the
 *     order (e.g. B2C, or order cancelled before debt was recorded), skip.
 */
async function handleOrderReversed(params: {
	eventId: string;
	orderId: string;
	organizationId: string | undefined;
	companyId: string;
	storeId: string;
	eventLabel: string;
}): Promise<void> {
	const { eventId, orderId, organizationId, companyId, storeId, eventLabel } =
		params;

	if (!organizationId) {
		logger.info(`budget.${eventLabel}: no organizationId, skipping (B2C)`, {
			eventId,
			orderId,
			companyId,
			storeId,
		});
		return;
	}

	// Deterministic per-order dedup key — both cancelled and refunded resolve to
	// the same marker, so the first reversal wins and the second is a no-op.
	const orderReversalDedupeKey = `order_reversal_${orderId}`;

	// Read the original debt_increase budgetRecord for this order.
	// We reverse THAT amount, not the current cart total, to avoid discrepancies
	// caused by edits, rounding, or order mutations after placement.
	const db = admin.firestore();
	const debtIncreaseSnap = await db
		.collection(budgetRecordsCollectionPath(companyId, storeId))
		.where("relatedId", "==", orderId)
		.where("type", "==", "debt_increase")
		.limit(1)
		.get();

	if (debtIncreaseSnap.empty) {
		// No debt_increase for this order — B2C path or order never charged.
		// Nothing to reverse; this is not an error.
		logger.info(`budget.${eventLabel}: no debt_increase record found for order, skipping`, {
			eventId,
			orderId,
			companyId,
			storeId,
		});
		return;
	}

	const debtIncreaseRecord = debtIncreaseSnap.docs[0].data() as TBudgetRecord;
	const amount = debtIncreaseRecord.amount;

	if (!Number.isInteger(amount) || amount <= 0) {
		logger.error(`budget.${eventLabel}: debt_increase record has invalid amount`, {
			eventId,
			orderId,
			amount,
			companyId,
			storeId,
		});
		return;
	}

	// Read server-side order doc for customer metadata (name, billingAccount, etc.)
	const orderPath = FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "orders",
		id: orderId,
	});
	const orderSnap = await db.doc(orderPath).get();
	if (!orderSnap.exists) {
		throw new Error(
			`budget.${eventLabel}: order not found: ${orderId} — will retry`,
		);
	}

	const order = orderSnap.data() as TOrder;

	if (!order.organizationId) {
		logger.info(`budget.${eventLabel}: server order has no organizationId, skipping`, {
			eventId,
			orderId,
			companyId,
			storeId,
		});
		return;
	}

	const orgName =
		order.client?.companyName ??
		order.client?.displayName ??
		order.organizationId;

	const customerId = order.client?.id ?? "system";
	const customerName =
		order.client?.displayName ??
		order.client?.companyName ??
		"";

	const billingAccountId = order.billingAccount?.id ?? null;

	const { applied } = await applyBudgetEvent({
		companyId,
		storeId,
		organizationId: order.organizationId,
		organizationName: orgName,
		customerId,
		customerName,
		billingAccountId,
		type: "debt_reduction",
		amount,
		relatedId: orderId,
		source: "order",
		// Per-order key: the same marker is claimed by whichever event arrives first
		// (cancelled or refunded). The second event sees ALREADY_EXISTS and returns
		// { applied: false } — net effect: reversed exactly once.
		causedByEventId: orderReversalDedupeKey,
	});

	logger.info(`budget.${eventLabel}: done`, {
		eventId,
		orderId,
		organizationId: order.organizationId,
		amount,
		applied,
		orderReversalDedupeKey,
		companyId,
		storeId,
	});
}

// ---------------------------------------------------------------------------
// order.cancelled subscriber
// ---------------------------------------------------------------------------

export const reduceDebtOnOrderCancelled = subscribe(
	{
		name: "budget-reduce-debt-on-order-cancelled",
		type: OrderEventTypes.cancelled,
		payloadSchema: OrderCancelledPayload,
	},
	async (event, ctx) => {
		await handleOrderReversed({
			eventId: ctx.eventId,
			orderId: event.payload.orderId,
			organizationId: event.payload.organizationId,
			companyId: ctx.companyId,
			storeId: ctx.storeId,
			eventLabel: "reduceDebtOnOrderCancelled",
		});
	},
);

// ---------------------------------------------------------------------------
// order.refunded subscriber
// ---------------------------------------------------------------------------

export const reduceDebtOnOrderRefunded = subscribe(
	{
		name: "budget-reduce-debt-on-order-refunded",
		type: OrderEventTypes.refunded,
		payloadSchema: OrderRefundedPayload,
	},
	async (event, ctx) => {
		await handleOrderReversed({
			eventId: ctx.eventId,
			orderId: event.payload.orderId,
			organizationId: event.payload.organizationId,
			companyId: ctx.companyId,
			storeId: ctx.storeId,
			eventLabel: "reduceDebtOnOrderRefunded",
		});
	},
);
