import { z } from "zod";

export const OrderEventTypes = {
	placed: "order.placed",
} as const;

export const OrderPlacedPayload = z.object({
	orderId: z.string().min(1),
	total: z.number().optional(),
	status: z.string().optional(),
	paymentType: z.string().optional(),
	organizationId: z.string().optional(),
	customerEmail: z.string().optional(),
});

export type OrderPlacedPayload = z.infer<typeof OrderPlacedPayload>;
