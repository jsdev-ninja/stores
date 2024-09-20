import { z } from "zod";

// 4. Order Schema
export const OrderSchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(), // Reference to User ID
	productIds: z.array(z.string().uuid()), // References to Product IDs
	totalAmount: z.number().positive({ message: "Total amount must be a positive number." }),
	status: z
		.enum(["pending", "processing", "shipped", "delivered", "cancelled"])
		.default("pending"),
	paymentId: z.string().uuid().optional(), // Reference to Payment ID
	createdAt: z.date().default(new Date()),
	updatedAt: z.date().optional(),
});
