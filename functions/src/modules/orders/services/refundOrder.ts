import { logger } from "firebase-functions/v2";
import { TOrder } from "@jsdev_ninja/core";
import { emitEvent } from "../../../platform/eventBus";
import { OrderEventTypes, OrderRefundedPayload } from "../events";

/**
 * Handles the refund of an order.
 * Emits the `order.refunded` event — the budget subscriber
 * (reduceDebtOnOrderRefunded) handles the debt reversal reactively.
 *
 * NOTE (B4): budgetWriter.onOrderCancelled removed. Debt reversal is now event-driven.
 */
export async function refundOrder(params: {
	order: TOrder;
	orderId: string;
	companyId: string;
	storeId: string;
	refundedByUserId?: string;
}) {
	const { order, orderId, companyId, storeId, refundedByUserId } = params;

	logger.info("refundOrder: handling refund", {
		orderId,
		companyId,
		storeId,
		organizationId: order.organizationId,
	});

	await emitEvent<OrderRefundedPayload>({
		type: OrderEventTypes.refunded,
		source: "orders",
		companyId,
		storeId,
		actorId: refundedByUserId ? `user:${refundedByUserId}` : "system",
		payload: {
			orderId: order.id,
			organizationId: order.organizationId,
			...(order.client?.id ? { clientId: order.client.id } : {}),
			originalTotal: order.cart?.cartTotal,
			refundedAt: Date.now(),
			refundedBy: refundedByUserId ?? "system",
		},
	});
}
