import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { FirebaseAPI, TOrder } from "@jsdev_ninja/core";
import { subscribe } from "../../../platform/eventBus";
import { OrderEventTypes, OrderCompletedPayload } from "../../orders/events";
import { createAppApi } from "../../../appApi";

/**
 * Subscribes to order.completed and automatically creates a delivery note
 * for EXTERNAL-payment orders.
 *
 * Design decisions:
 * - Only fires for paymentType === "external". J5 orders are handled by
 *   ledger/subscribers/chargeJ5OnOrderCompleted.ts.
 * - Re-reads the authoritative order from Firestore to guard against
 *   stale/spoofed payloads.
 * - Idempotency: skips if order.deliveryNote or order.ezDeliveryNote already
 *   exists (appApi.documents.createDeliveryNote also has an internal guard).
 * - Does NOT throw on business failures — logs and returns to avoid poisoning
 *   the event queue. The admin "Create delivery note" button is the fallback.
 * - The appApi call emits documents.delivery_note_created, which
 *   accrueOnDeliveryNoteCreated consumes for AR. Do NOT accrue separately.
 */
export const createDeliveryNoteOnOrderCompleted = subscribe(
	{
		name: "documents-create-delivery-note-on-order-completed",
		type: OrderEventTypes.completed,
		payloadSchema: OrderCompletedPayload,
		maxAttempts: 1,
		functionOptions: { memory: "1GiB" },
	},
	async (event, ctx) => {
		const { payload } = event;
		const { companyId, storeId, eventId } = ctx;

		logger.info("documents.createDeliveryNoteOnOrderCompleted: received", {
			eventId,
			orderId: payload.orderId,
			companyId,
			storeId,
			paymentType: payload.paymentType,
		});

		// Early exit based on payload
		if (payload.paymentType !== "external") {
			logger.info(
				"documents.createDeliveryNoteOnOrderCompleted: paymentType is not external, skipping",
				{
					eventId,
					orderId: payload.orderId,
					paymentType: payload.paymentType,
					companyId,
					storeId,
				},
			);
			return;
		}

		// Read authoritative order from Firestore to avoid acting on stale payload data
		const db = admin.firestore();
		const orderPath = FirebaseAPI.firestore.getPath({
			companyId,
			storeId,
			collectionName: "orders",
			id: payload.orderId,
		});

		const orderSnap = await db.doc(orderPath).get();
		if (!orderSnap.exists) {
			logger.warn(
				"documents.createDeliveryNoteOnOrderCompleted: order not found, will not retry",
				{
					eventId,
					orderId: payload.orderId,
					companyId,
					storeId,
				},
			);
			return;
		}

		const order = orderSnap.data() as TOrder;

		// Re-validate paymentType against the authoritative server doc
		if (order.paymentType !== "external") {
			logger.info(
				"documents.createDeliveryNoteOnOrderCompleted: authoritative paymentType is not external, skipping",
				{
					eventId,
					orderId: payload.orderId,
					paymentType: order.paymentType,
					companyId,
					storeId,
				},
			);
			return;
		}

		// Idempotency guard — delivery note already created upstream or by admin action
		if (order.deliveryNote || order.ezDeliveryNote) {
			logger.info(
				"documents.createDeliveryNoteOnOrderCompleted: delivery note already exists, skipping",
				{
					eventId,
					orderId: payload.orderId,
					companyId,
					storeId,
				},
			);
			return;
		}

		logger.info(
			"documents.createDeliveryNoteOnOrderCompleted: creating delivery note",
			{
				eventId,
				orderId: payload.orderId,
				companyId,
				storeId,
			},
		);

		const appApi = createAppApi({ storeId, companyId });
		const res = await appApi.documents.createDeliveryNote(order);

		if (res.success) {
			logger.info("documents.createDeliveryNoteOnOrderCompleted: success", {
				eventId,
				orderId: payload.orderId,
				companyId,
				storeId,
			});
		} else {
			logger.error(
				"documents.createDeliveryNoteOnOrderCompleted: failed to create delivery note",
				{
					eventId,
					orderId: payload.orderId,
					companyId,
					storeId,
					error: (res.error as any)?.message ?? res.error,
				},
			);
			// Do NOT throw — log and return to avoid poisoning the event queue.
			// The admin "Create delivery note" button remains a manual fallback.
		}
	},
);
