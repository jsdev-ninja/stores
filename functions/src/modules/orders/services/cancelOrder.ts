import { logger } from "firebase-functions/v2";
import { TOrder } from "@jsdev_ninja/core";
import { emitEvent } from "../../../platform/eventBus";
import { budgetWriter } from "../../budget/internal/writer";
import { OrderEventTypes, OrderCancelledPayload } from "../events";

/**
 * Handles the cancellation of an order: reverses any budget impact (best-effort)
 * and emits the `order.cancelled` event for downstream subscribers.
 *
 * Budget reversal only runs when the order belongs to an organization (B2B).
 * B2C cancellations have no budget impact to reverse.
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

	if (order.organizationId) {
		await budgetWriter
			.onOrderCancelled(order, companyId, storeId, "order_cancelled")
			.catch((err) => {
				logger.error("cancelOrder: budget reversal failed", {
					orderId,
					companyId,
					storeId,
					err,
				});
			});
	}

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
