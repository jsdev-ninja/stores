import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { FirebaseAPI, TOrder } from "@jsdev_ninja/core";
import { subscribe } from "../../../platform/eventBus";
import {
	DocumentEventTypes,
	DocumentDeliveryNoteCreatedPayload,
} from "../events";
import { accrueDebt } from "../services/accrueDebt";

/**
 * Subscribes to documents.delivery_note_created and posts a "+" AR accrual
 * entry for B2B (organization) orders on credit terms.
 *
 * Design decisions (locked):
 * - Invoice has NO balance effect. Debt accrues ONCE at delivery-note creation.
 * - Refund (direction:"out") does NOT touch AR. Only direction:"in" settlements do.
 * - B2C orders (no organizationId) are skipped — no AR for cash buyers.
 *
 * Security:
 * - Amount is read from the SERVER-SIDE order doc (cart.cartTotal), not from the
 *   event payload, so a spoofed or replayed event cannot inflate debt.
 * - organizationId is taken from the SERVER order doc (order.organizationId).
 *   The payload's organizationId is used only as an early-exit hint (skip B2C
 *   before the Firestore read); the server value is what drives AR writes.
 *
 * Idempotency:
 * - Entry doc id = `dn_{deliveryNoteId}`. A replay of the same event is a no-op.
 *
 * This subscriber REPLACES ledger/subscribers/postDebitOnDeliveryNoteCreated.ts
 * which has been deleted. Both must NOT coexist (double-accrual risk).
 */
export const accrueOnDeliveryNoteCreated = subscribe(
	{
		name: "documents-accrue-on-delivery-note-created",
		type: DocumentEventTypes.deliveryNoteCreated,
		payloadSchema: DocumentDeliveryNoteCreatedPayload,
	},
	async (event, ctx) => {
		const { payload } = event;
		const { companyId, storeId, eventId } = ctx;

		logger.info("documents.accrueOnDeliveryNoteCreated: received", {
			eventId,
			orderId: payload.orderId,
			deliveryNoteId: payload.deliveryNoteId ?? null,
			organizationId: payload.organizationId ?? null,
			companyId,
			storeId,
		});

		// Skip B2C — no organization means no accounts-receivable debt.
		if (!payload.organizationId) {
			logger.info(
				"documents.accrueOnDeliveryNoteCreated: no organizationId, skipping (B2C)",
				{ eventId, orderId: payload.orderId, companyId, storeId },
			);
			return;
		}

		// Read the server-side order doc for the authoritative fulfilled amount.
		const db = admin.firestore();
		const orderPath = FirebaseAPI.firestore.getPath({
			companyId,
			storeId,
			collectionName: "orders",
			id: payload.orderId,
		});

		const orderSnap = await db.doc(orderPath).get();
		if (!orderSnap.exists) {
			// Throw so the event bus retries (read-after-write propagation lag).
			throw new Error(
				`documents.accrueOnDeliveryNoteCreated: order not found: ${payload.orderId} — will retry`,
			);
		}

		const order = orderSnap.data() as TOrder;

		// Cross-check organizationId against the server doc (security invariant).
		if (!order.organizationId) {
			logger.info(
				"documents.accrueOnDeliveryNoteCreated: server order has no organizationId, skipping",
				{ eventId, orderId: payload.orderId, companyId, storeId },
			);
			return;
		}

		// TODO(money-units): cart.cartTotal is stored in SHEKELS (ILS floats) across
		// current + legacy order docs, while AR standardizes on integer agorot.
		// Convert ILS→agorot here at the subscriber boundary. Once orders store agorot
		// upstream, drop the *100. See CLAUDE.md "Money".
		const cartTotalShekels = order.cart?.cartTotal;
		if (
			typeof cartTotalShekels !== "number" ||
			!Number.isFinite(cartTotalShekels) ||
			cartTotalShekels <= 0
		) {
			logger.error(
				"documents.accrueOnDeliveryNoteCreated: cart.cartTotal is not a positive number — skipping",
				{
					eventId,
					orderId: payload.orderId,
					cartTotal: cartTotalShekels,
					companyId,
					storeId,
				},
			);
			// Don't throw — log and skip to avoid poisoning the event queue.
			return;
		}

		const amount = Math.round(cartTotalShekels * 100); // shekels → agorot

		// Resolve the delivery note id from the server-side order doc (authoritative).
		// The entry doc id must be 1:1 with a physical delivery note:
		//   - order.deliveryNote.id is written by appApi at the same time as the event.
		//   - Falling back to orderId would break idempotency: a re-issued note would
		//     collide with the original, and two notes missing an id would double-accrue.
		// If no stable id is resolvable, log an error and skip — do NOT fall back.
		const deliveryNoteId = order.deliveryNote?.id ?? order.deliveryNote?.number ?? null;
		if (!deliveryNoteId) {
			logger.error(
				"documents.accrueOnDeliveryNoteCreated: no stable delivery note id on server order doc — skipping (no orderId fallback to preserve idempotency)",
				{
					eventId,
					orderId: payload.orderId,
					payloadDeliveryNoteId: payload.deliveryNoteId ?? null,
					companyId,
					storeId,
				},
			);
			// Do not throw — skip to avoid poisoning the event queue.
			return;
		}

		const { applied } = await accrueDebt({
			organizationId: order.organizationId,
			amount,
			deliveryNoteId,
			deliveryNoteNumber: payload.deliveryNoteNumber,
			orderId: order.id,
			billingAccountId: order.billingAccount?.id ?? null,
			causedByEventId: eventId,
			companyId,
			storeId,
		});

		logger.info("documents.accrueOnDeliveryNoteCreated: done", {
			eventId,
			orderId: order.id,
			organizationId: order.organizationId,
			amount,
			applied,
			companyId,
			storeId,
		});
	},
);
