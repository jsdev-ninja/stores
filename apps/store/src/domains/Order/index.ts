import { FirebaseApi } from "src/lib/firebase";
import { z } from "zod";
import { OrderSchema } from "@jsdev_ninja/core";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const NewOrderSchema = OrderSchema.omit({ id: true });

export type TNewOrder = z.infer<typeof NewOrderSchema>;

export type TOrder = z.infer<typeof OrderSchema>;

/**
 * Terminal order statuses — the order is closed, no further admin actions
 * apply (no picking, no approve, no edit). UI buttons that mutate the order
 * should gate on `!isOrderFinal(status)`.
 */
export const FINAL_ORDER_STATUSES = [
	"completed",
	"cancelled",
	"refunded",
] as const satisfies readonly TOrder["status"][];

export const isOrderFinal = (status: TOrder["status"]): boolean =>
	(FINAL_ORDER_STATUSES as readonly TOrder["status"][]).includes(status);

const initialState: { orders: TOrder[] } = {
	orders: [],
};
export const ordersSlice = createSlice({
	name: "orders",
	initialState,
	reducers: {
		setOrders(state, action: PayloadAction<TOrder[]>) {
			state.orders = action.payload;
		},
	},
	selectors: {
		selectUnPaidPendingOrder: (state) => {
			return state.orders.find(
				(order) => order.status == "draft" && order.paymentStatus === "pending"
			);
		},
	},
});

// @deprecated
export const OrderApi = {
	createOrder: async (newOrder: TNewOrder) => {
		const response = await FirebaseApi.firestore.create(newOrder, "orders");
		return response;
	},
	getOrder: async (id: string) => {
		const response = await FirebaseApi.firestore.get<TOrder>(id, "orders");
		return response;
	},
};
