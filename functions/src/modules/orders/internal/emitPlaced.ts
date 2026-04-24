import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { TOrder } from "@jsdev_ninja/core";
import { emit } from "../../../platform/eventBus";

export async function emitOrderPlaced(params: {
	order: TOrder;
	orderId: string;
	companyId: string;
	storeId: string;
}) {
	try {
		await admin.firestore().runTransaction(async (tx) => {
			emit(tx, {
				type: "order.placed",
				source: "orders",
				companyId: params.companyId,
				storeId: params.storeId,
				actorId: params.order.userId ? `user:${params.order.userId}` : "system",
				payload: {
					orderId: params.orderId,
					total: params.order.cart?.cartTotal ?? 0,
					status: params.order.status,
					paymentType: params.order.paymentType,
					organizationId: params.order.organizationId,
					customerEmail: params.order.client?.email,
					billingAccount: params.order.billingAccount ?? null,
				},
			});
		});
	} catch (err) {
		logger.error("eventBus.emit.order_placed.failed", {
			orderId: params.orderId,
			companyId: params.companyId,
			storeId: params.storeId,
			err,
		});
	}
}
