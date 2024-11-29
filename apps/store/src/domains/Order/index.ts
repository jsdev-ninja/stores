import { FirebaseApi } from "src/lib/firebase";
import { z } from "zod";
import { AddressSchema, ProfileSchema } from "src/types";
import { ProductSchema } from "@jsdev_ninja/core";

// pending - order created / by user
// processing order accepted by store by admin
// delivered - order delivered by admin
// canceled - order canceled by user/admin
// completed - order paid by admin

type PaymentStatus = "pending" | "completed" | "failed" | "refunded" | "partially_refunded";

type PaymentMethod = "credit_card" | "paypal" | "bank_transfer" | "cash_on_delivery";

export const OrderSchema = z.object({
	type: z.literal("Order"),
	id: z.string(),
	companyId: z.string(),
	storeId: z.string(),
	userId: z.string(),
	status: z.enum(["pending", "processing", "delivered", "canceled", "completed", "refunded"]),
	cart: z.object({
		id: z.string(),
		items: z.array(z.object({ product: ProductSchema, amount: z.number() })),
		cartTotal: z.number(),
		cartDiscount: z.number(),
		cartVat: z.number(),
	}),
	date: z.number(),
	deliveryDate: z.number().optional(),
	client: ProfileSchema,
	address: AddressSchema,
});

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
