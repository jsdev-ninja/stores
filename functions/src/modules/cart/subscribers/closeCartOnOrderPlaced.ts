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
		logger.info("closeCartOnOrderPlaced: received", {
			eventId: event.id,
			orderId: event.payload.orderId,
			cartId: event.payload.cartId,
			companyId: ctx.companyId,
			storeId: ctx.storeId,
		});

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

		try {
			await appApi.cart.close(event.payload.cartId);
			logger.info("closeCartOnOrderPlaced: cart closed", {
				eventId: event.id,
				orderId: event.payload.orderId,
				cartId: event.payload.cartId,
			});
		} catch (err) {
			logger.error("closeCartOnOrderPlaced: cart.close failed", {
				eventId: event.id,
				orderId: event.payload.orderId,
				cartId: event.payload.cartId,
				err,
			});
			throw err;
		}
	},
);
