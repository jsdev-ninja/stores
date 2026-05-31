import { logger } from "firebase-functions/v2";
import { TOrder } from "@jsdev_ninja/core";
import { emitEvent } from "../../../platform/eventBus";
import { OrderEventTypes, OrderCancelledPayload } from "../events";

/**
 * Handles the cancellation of an order.
 * Emits the `order.cancelled` event — the budget subscriber
 * (reduceDebtOnOrderCancelled) handles the debt reversal reactively.
 */
export async function cancelOrder(params: {
	order: TOrder;
	orderId: string;
	companyId: string;
	storeId: string;
	reason?: string;
	cancelledByUserId?: string;
}) {
	const { order, orderId, companyId, storeId, reason, cancelledByUserId } =
		params;

	logger.info("cancelOrder: handling cancellation", {
		orderId,
		companyId,
		storeId,
		organizationId: order.organizationId,
	});

	// NOTE (B4): budgetWriter.onOrderCancelled removed.
	// Debt reversal is now handled reactively by the budget subscriber
	// (reduceDebtOnOrderCancelled) which fires on the order.cancelled event below.

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
}
