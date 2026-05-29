import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { TOrder } from "@jsdev_ninja/core";
import { emit } from "../../../platform/eventBus";
import { OrderEventTypes } from "../events";

export async function emitOrderCancelled(params: {
	order: TOrder;
	companyId: string;
	storeId: string;
	reason?: string;
	cancelledByUserId?: string;
}) {
	try {
		await admin.firestore().runTransaction(async (tx) => {
			emit(tx, {
				type: OrderEventTypes.cancelled,
				source: "orders",
				companyId: params.companyId,
				storeId: params.storeId,
				actorId: params.cancelledByUserId ? `user:${params.cancelledByUserId}` : "system",
				payload: {
					orderId: params.order.id,
					organizationId: params.order.organizationId,
					...(params.order.client?.id ? { clientId: params.order.client.id } : {}),
					total: params.order.cart?.cartTotal,
					reason: params.reason,
					cancelledAt: Date.now(),
					cancelledBy: params.cancelledByUserId ?? "system",
				},
			});
		});
	} catch (err) {
		logger.error("eventBus.emit.order_cancelled.failed", {
			orderId: params.order.id,
			companyId: params.companyId,
			storeId: params.storeId,
			err,
		});
	}
}
