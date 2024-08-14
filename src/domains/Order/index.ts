import { FirebaseApi } from "src/lib/firebase";
import { z } from "zod";

export const OrderSchema = z.object({
	type: z.literal("order"),
	id: z.string(),
	companyId: z.string(),
	storeId: z.string(),
	userId: z.string(),
	status: z.enum(["pending", "inProgress", "delivered", "canceled", "completed"]),
	paymentStatus: z.enum(["paid", "notPaid"]),
	cart: z.array(z.object({})), // todo
	date: z.number(),
	deliveryDate: z.number().optional(),
});

export const NewOrderSchema = OrderSchema.omit({ id: true });

export type TNewOrder = z.infer<typeof NewOrderSchema>;

export type TOrder = z.infer<typeof OrderSchema>;

export const OrderApi = {
	createOrder: async (newOrder: TNewOrder) => {
		console.log("newOrder", newOrder);

		const response = await FirebaseApi.firestore.create(newOrder, "orders");
		console.log("response", response);
		return response;
	},
};
