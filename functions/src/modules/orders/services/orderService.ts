import { logger } from "firebase-functions/v2";
import admin from "firebase-admin";
import { FirebaseAPI } from "@jsdev_ninja/core";
import { emit } from "../../../platform/eventBus";
import { OrderEventTypes } from "../events";
import { CreateOrderParams, UpdateOrderParams } from "../types";

export const orderService = {
	async create(params: CreateOrderParams): Promise<void> {
		const { order, companyId, storeId, actorId } = params;

		logger.info("orderService.createOrder: handling creation", {
			orderId: order.id,
			companyId,
			storeId,
			organizationId: order.organizationId,
		});

		const db = admin.firestore();
		const orderPath = FirebaseAPI.firestore.getPath({
			collectionName: "orders",
			companyId,
			storeId,
		});
		const orderRef = db.collection(orderPath).doc(order.id);

		await db.runTransaction(async (tx) => {
			tx.set(orderRef, order);

			emit(tx, {
				type: OrderEventTypes.placed,
				source: "orders",
				companyId,
				storeId,
				actorId: actorId ?? "system",
				payload: {
					orderId: order.id,
					cartId: order.cart?.id,
					total: order.cart?.cartTotal,
					status: order.status,
					paymentType: order.paymentType,
					organizationId: order.organizationId,
					customerEmail: order.client?.email,
				},
			});
		});
	},

	async update(params: UpdateOrderParams): Promise<void> {
		const { orderId, updates, companyId, storeId, actorId } = params;

		logger.info("orderService.update: handling update", {
			orderId,
			companyId,
			storeId,
		});

		const db = admin.firestore();
		const orderPath = FirebaseAPI.firestore.getPath({
			collectionName: "orders",
			companyId,
			storeId,
		});
		const orderRef = db.collection(orderPath).doc(orderId);

		await orderRef.update({
			...updates,
			updatedAt: Date.now(),
			updatedBy: actorId ?? "system",
		});
	},
};
