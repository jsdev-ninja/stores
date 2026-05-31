import * as functions from "firebase-functions/v1";
import { logger } from "firebase-functions/v2";
import { FirebaseAPI, TOrder } from "@jsdev_ninja/core";
import { emitEvent } from "../../../platform/eventBus";
import { OrderEventTypes, OrderPlacedPayload } from "../events";

export const onOrderCreated = functions.firestore
	.document(FirebaseAPI.firestore.getDocPath("orders"))
	.onCreate(async (snap, context) => {
		const { storeId, companyId, id: orderId } = context.params;
		const order = snap.data() as TOrder;

		logger.info("onOrderCreated: new order created", {
			orderId,
			companyId,
			storeId,
			status: order.status,
			paymentStatus: order.paymentStatus,
			paymentType: order.paymentType,
			organizationId: order.organizationId,
		});

		await emitEvent<OrderPlacedPayload>({
			type: OrderEventTypes.placed,
			source: "orders",
			companyId,
			storeId,
			actorId: order.userId ? `user:${order.userId}` : "system",
			payload: {
				orderId,
				cartId: order.cart?.id,
				total: order.cart?.cartTotal ?? 0,
				status: order.status,
				paymentType: order.paymentType,
				organizationId: order.organizationId,
				customerEmail: order.client?.email,
			},
		});
	});
