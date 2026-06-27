import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { FirebaseAPI, TOrder } from "@jsdev_ninja/core";
import { subscribe } from "../../../platform/eventBus";
import { OrderEventTypes, OrderCompletedPayload } from "../../orders/events";
import { internalChargeJ5Order } from "../internal/chargeJ5Order";

/**
 * Subscribes to order.completed and automatically charges the payment for J5 orders.
 */
export const chargeJ5OnOrderCompleted = subscribe(
	{
		name: "ledger-charge-j5-on-order-completed",
		type: OrderEventTypes.completed,
		payloadSchema: OrderCompletedPayload,
	},
	async (event, ctx) => {
		const { payload } = event;
		const { companyId, storeId, eventId } = ctx;

		logger.info("ledger.chargeJ5OnOrderCompleted: received", {
			eventId,
			orderId: payload.orderId,
			companyId,
			storeId,
			paymentType: payload.paymentType,
		});

		// Early exit based on payload
		if (payload.paymentType !== "j5") {
			logger.info(
				"ledger.chargeJ5OnOrderCompleted: paymentType is not j5, skipping",
				{ eventId, orderId: payload.orderId, paymentType: payload.paymentType },
			);
			return;
		}

		// Read authoritative order from Firestore to avoid race conditions
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
				"ledger.chargeJ5OnOrderCompleted: order not found, will not retry",
				{ eventId, orderId: payload.orderId },
			);
			return;
		}

		const order = orderSnap.data() as TOrder;

		// Re-validate against authoritative order
		if (order.paymentType !== "j5") {
			logger.info(
				"ledger.chargeJ5OnOrderCompleted: authoritative paymentType is not j5, skipping",
				{ eventId, orderId: payload.orderId, paymentType: order.paymentType },
			);
			return;
		}

		// Prevent double charging
		if (order.paymentStatus === "completed") {
			logger.info(
				"ledger.chargeJ5OnOrderCompleted: order paymentStatus is already completed, skipping",
				{ eventId, orderId: payload.orderId },
			);
			return;
		}

		logger.info("ledger.chargeJ5OnOrderCompleted: processing charge", {
			eventId,
			orderId: payload.orderId,
		});

		// Call internal charge logic
		const res = await internalChargeJ5Order({
			orderId: order.id,
			companyId,
			storeId,
			contextUid: null,
			actorId: "system",
		});

		if (res.success) {
			logger.info("ledger.chargeJ5OnOrderCompleted: success", {
				eventId,
				orderId: payload.orderId,
			});
		} else {
			logger.error("ledger.chargeJ5OnOrderCompleted: charge failed", {
				eventId,
				orderId: payload.orderId,
				error: res.error,
				errMessage: res.errMessage,
			});
			// Depending on error handling policy, we might want to throw to retry
			// if it was a network error, but for now we log it.
		}
	},
);
