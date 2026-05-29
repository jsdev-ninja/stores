import { logger } from "firebase-functions/v2";
import { subscribe } from "../../../platform/eventBus";
import { createAppApi } from "../../../appApi";
import { OrderEventTypes, OrderPlacedPayload } from "../../orders";

export const onOrderPlacedCloseCart = subscribe(
	{
		name: "order-placed-close-cart",
		type: OrderEventTypes.placed,
		payloadSchema: OrderPlacedPayload,
	},
	async (event, ctx) => {
		if (!event.payload.cartId) {
			logger.warn("closeCartOnOrderPlaced: no cartId in payload, skipping", {
				orderId: event.payload.orderId,
				eventId: event.id,
			});
			return;
		}

		const appApi = createAppApi({
			storeId: ctx.storeId,
			companyId: ctx.companyId,
		});
		await appApi.cart.close(event.payload.cartId);
	},
);
