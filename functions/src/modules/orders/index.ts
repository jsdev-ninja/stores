import { handleOrderCreated, handleOrderUpdated } from "./internal/lifecycle";

export const ordersModule = {
	onCreated: handleOrderCreated,
	onUpdated: handleOrderUpdated,
} as const;

export { OrderEventTypes, OrderPlacedPayload } from "./events";
