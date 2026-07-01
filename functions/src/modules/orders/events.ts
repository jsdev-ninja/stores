import { z } from "zod";

export const OrderEventTypes = {
	placed: "order.placed",
	cancelled: "order.cancelled",
	completed: "order.completed",
} as const;

export const OrderPlacedPayload = z.object({
	orderId: z.string().min(1),
	cartId: z.string().optional(),
	total: z.number().optional(),
	status: z.string().optional(),
	paymentType: z.string().optional(),
	// Orders without an organization emit organizationId: null (not undefined).
	// `.nullish()` accepts null | undefined | string so the payload validates and
	// downstream subscribers (admin email, close cart) actually run.
	organizationId: z.string().nullish(),
	customerEmail: z.string().optional(),
});

export type OrderPlacedPayload = z.infer<typeof OrderPlacedPayload>;

export const OrderCancelledPayload = z.object({
	orderId: z.string().min(1),
	organizationId: z.string().nullish(),
	clientId: z.string().optional(),
	total: z.number().optional(),
	reason: z.string().optional(),
	cancelledAt: z.number().optional(),
	cancelledBy: z.string().optional(),
});
export type OrderCancelledPayload = z.infer<typeof OrderCancelledPayload>;

export const OrderCompletedPayload = z.object({
	orderId: z.string().min(1),
	paymentType: z.string().optional(),
});
export type OrderCompletedPayload = z.infer<typeof OrderCompletedPayload>;
