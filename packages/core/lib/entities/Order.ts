import { z } from "zod";
import { ProfileSchema } from "./Profile";
import { ProductSchema } from "./Product";
import { notEmptyTextSchema } from "./Atoms";

// pending - order created / by user
// processing order accepted by store by admin
// delivered - order delivered by admin
// canceled - order canceled by user/admin
// completed - order paid by admin

// type PaymentMethod = "credit_card" | "paypal" | "bank_transfer" | "cash_on_delivery";

export const OrderSchema = z.object({
	type: z.literal("Order"),
	id: notEmptyTextSchema,
	companyId: notEmptyTextSchema,
	storeId: notEmptyTextSchema,
	userId: notEmptyTextSchema,
	status: z.enum([
		"draft", // before payment
		"pending", // after payment
		"processing", // after admin approve
		"in_delivery", //
		"delivered",
		"cancelled",
		"completed",
		"refunded",
	]),
	paymentStatus: z.enum(["pending", "pending_j5", "completed", "failed", "refunded"]), //todo check if hyp support partial refund
	cart: z.object({
		id: z.string(),
		items: z.array(z.object({ product: ProductSchema, amount: z.number() })),
		cartDiscount: z.number(),
		cartTotal: z.number(),
		cartVat: z.number(),
	}),
	originalAmount: z.number().positive().optional(), // what client pay
	actualAmount: z.number().positive().optional(), // what store charge
	date: z.number(),
	deliveryDate: z.number().optional(),
	createdAt: z.number().optional(),
	client: ProfileSchema.required({}),
});

export type TOrder = z.infer<typeof OrderSchema>;
