import { TOrder } from "@jsdev_ninja/core";
import { emitEvent } from "../../../platform/eventBus";
import { OrderEventTypes, OrderPlacedPayload } from "../events";

export async function emitOrderPlaced(params: {
	order: TOrder;
	orderId: string;
	companyId: string;
	storeId: string;
}) {
	await emitEvent<OrderPlacedPayload>({
		type: OrderEventTypes.placed,
		source: "orders",
		companyId: params.companyId,
		storeId: params.storeId,
		actorId: params.order.userId ? `user:${params.order.userId}` : "system",
		payload: {
			orderId: params.orderId,
			cartId: params.order.cart?.id,
			total: params.order.cart?.cartTotal ?? 0,
			status: params.order.status,
			paymentType: params.order.paymentType,
			organizationId: params.order.organizationId,
			customerEmail: params.order.client?.email,
		},
	});
}
