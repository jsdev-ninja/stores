import { z } from "zod";
import { ProductSchema } from "./Product";

/**
 * Per-line fulfillment status set during picking:
 *  - delivered   = picked/supplied as ordered (default when unset)
 *  - missing     = not in stock, not supplied (excluded from the fulfilled total)
 *  - substituted = replaced with another product (see `substitutedWith`)
 */
export const FulfillmentStatusSchema = z.enum(["delivered", "missing", "substituted"]);
export type TFulfillmentStatus = z.infer<typeof FulfillmentStatusSchema>;

/** The replacement product chosen when a line is `substituted`. */
export const SubstitutedWithSchema = z.object({
	product: ProductSchema,
	amount: z.number().positive(),
	price: z.number(),
});
export type TSubstitutedWith = z.infer<typeof SubstitutedWithSchema>;

export const CartItemProductSchema = z.object({
	product: ProductSchema,
	originalPrice: z.number().optional(),
	finalPrice: z.number().optional(),
	finalDiscount: z.number().optional(),
	amount: z.number().positive({ message: "Quantity must be a positive number." }),
	// Picking / fulfillment — optional so existing items stay valid (treated as "delivered").
	status: FulfillmentStatusSchema.optional(),
	substitutedWith: SubstitutedWithSchema.nullable().optional(),
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
