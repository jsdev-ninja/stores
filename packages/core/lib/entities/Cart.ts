import { z } from "zod";
import { ProductSchema } from "./Product";

export const CartItemProductSchema = z.object({
	product: ProductSchema,
	originalPrice: z.number().optional(),
	finalPrice: z.number().optional(),
	finalDiscount: z.number().optional(),
	amount: z.number().int().positive({ message: "Quantity must be a positive integer." }),
});

export type TCartItemProduct = z.infer<typeof CartItemProductSchema>;

export const CartSchema = z.object({
	type: z.literal("Cart"),
	id: z.string().uuid(),
	companyId: z.string().uuid(),
	storeId: z.string().uuid(),
	userId: z.string().uuid(),
	status: z.enum(["active", "draft", "completed"]),
	items: z.array(CartItemProductSchema),
});

export type TCart = z.infer<typeof CartSchema>;
