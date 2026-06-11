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

		// A "draft" order is an unpaid checkout that has been (or is about to be)
		// redirected to the online payment gateway (J5). We must NOT close the cart
		// yet: if the customer presses "back" to add more products, their cart has
		// to survive. The cart is closed only once payment is actually confirmed —
		// see markOrderPaidOnTransactionPosted (closes the cart on hyp_j5_auth).
		if (event.payload.status === "draft") {
			logger.info(
				"closeCartOnOrderPlaced: order is a draft (payment pending), keeping cart open",
				{
					orderId: event.payload.orderId,
					cartId: event.payload.cartId,
					eventId: event.id,
				},
			);
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
