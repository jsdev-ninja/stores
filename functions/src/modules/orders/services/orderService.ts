import { logger } from "firebase-functions/v2";
import admin from "firebase-admin";
import { FirebaseAPI } from "@jsdev_ninja/core";
import { emit, emitEvent } from "../../../platform/eventBus";
import { createAppApi } from "../../../appApi";
import {
	OrderEventTypes,
	OrderCancelledPayload,
	OrderPlacedPayload,
} from "../events";
import {
	CancelOrderParams,
	CompleteOrderParams,
	CreateOrderParams,
	UpdateOrderParams,
} from "../types";

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

	async cancel(params: CancelOrderParams): Promise<void> {
		const { order, orderId, companyId, storeId, reason, cancelledByUserId } =
			params;

		logger.info("cancelOrder: handling cancellation", {
			orderId,
			companyId,
			storeId,
			organizationId: order.organizationId,
		});

		await emitEvent<OrderCancelledPayload>({
			type: OrderEventTypes.cancelled,
			source: "orders",
			companyId,
			storeId,
			actorId: cancelledByUserId ? `user:${cancelledByUserId}` : "system",
			payload: {
				orderId: order.id,
				organizationId: order.organizationId,
				...(order.client?.id ? { clientId: order.client.id } : {}),
				total: order.cart?.cartTotal,
				reason,
				cancelledAt: Date.now(),
				cancelledBy: cancelledByUserId ?? "system",
			},
		});
	},

	async complete(params: CompleteOrderParams): Promise<void> {
		const { order, orderId, companyId, storeId } = params;
		const appApi = createAppApi({ storeId, companyId });

		if (order.paymentType === "external") {
			logger.info("completeOrder: createDeliveryNote", {
				orderId,
				companyId,
				storeId,
				email: order.client?.email,
				displayName: order.client?.displayName,
			});
			await appApi.documents.createDeliveryNote(order);
		} else {
			logger.info(
				"completeOrder: skip createDeliveryNote - paymentType is not external, HYP handles it",
				{
					orderId,
					companyId,
					storeId,
					paymentType: order.paymentType,
				},
			);
		}
	},
};
