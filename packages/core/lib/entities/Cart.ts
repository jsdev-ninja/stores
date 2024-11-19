import { z } from "zod";
// 5. Cart Schema
export const CartSchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(), // Reference to User ID
	items: z.array(
		z.object({
			productId: z.string().uuid(), // Reference to Product ID
			quantity: z.number().int().positive({ message: "Quantity must be a positive integer." }),
		})
	),
	createdAt: z.date().default(new Date()),
	updatedAt: z.date().optional(),
});
