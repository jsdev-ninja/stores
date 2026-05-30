import { TOrder } from "@jsdev_ninja/core";
import { emitEvent } from "../../../platform/eventBus";
import { OrderEventTypes, OrderCancelledPayload } from "../events";

export async function emitOrderCancelled(params: {
	order: TOrder;
	companyId: string;
	storeId: string;
	reason?: string;
	cancelledByUserId?: string;
}) {
	await emitEvent<OrderCancelledPayload>({
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
}
