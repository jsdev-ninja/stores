import { z } from "zod";

export const OrderEventTypes = {
	placed: "order.placed",
	cancelled: "order.cancelled",
} as const;

export const OrderPlacedPayload = z.object({
	orderId: z.string().min(1),
	cartId: z.string().optional(),
	total: z.number().optional(),
	status: z.string().optional(),
	paymentType: z.string().optional(),
	organizationId: z.string().optional(),
	customerEmail: z.string().optional(),
});

export type OrderPlacedPayload = z.infer<typeof OrderPlacedPayload>;

export const OrderCancelledPayload = z.object({
	orderId: z.string().min(1),
	organizationId: z.string().optional(),
	clientId: z.string().optional(),
	total: z.number().optional(),
	reason: z.string().optional(),
	cancelledAt: z.number().optional(),
	cancelledBy: z.string().optional(),
});
export type OrderCancelledPayload = z.infer<typeof OrderCancelledPayload>;
