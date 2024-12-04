import { z } from "zod";
// 7. Payment Schema
export const PaymentSchema = z.object({
    id: z.string().uuid(),
    orderId: z.string().uuid(), // Reference to Order ID
    amount: z.number().positive({ message: "Amount must be a positive number." }),
    method: z.enum(["credit_card", "paypal", "bank_transfer"]),
    status: z.enum(["pending", "completed", "failed"]).default("pending"),
    transactionId: z.string().optional(),
    createdAt: z.date().default(new Date()),
    updatedAt: z.date().optional(),
});
