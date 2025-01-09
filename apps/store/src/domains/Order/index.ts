import { FirebaseApi } from "src/lib/firebase";
import { z } from "zod";
import { OrderSchema } from "@jsdev_ninja/core";

export const NewOrderSchema = OrderSchema.omit({ id: true });

export type TNewOrder = z.infer<typeof NewOrderSchema>;

export type TOrder = z.infer<typeof OrderSchema>;

export const OrderApi = {
	createOrder: async (newOrder: TNewOrder) => {
		console.log("newOrder", newOrder);

		const response = await FirebaseApi.firestore.create(newOrder, "orders");
		return response;
	},
	getOrder: async (id: string) => {
		const response = await FirebaseApi.firestore.get<TOrder>(id, "orders");
		return response;
	},
};
