import { z } from "zod";

export const OrderEventTypes = {
	placed: "order.placed",
	completed: "order.completed",
	cancelled: "order.cancelled",
	refunded: "order.refunded",
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

export const OrderCompletedPayload = z.object({
	orderId: z.string().min(1),
	organizationId: z.string().optional(),
	clientId: z.string().optional(),
	total: z.number().optional(),
	completedAt: z.number().optional(),
});
export type OrderCompletedPayload = z.infer<typeof OrderCompletedPayload>;

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

export const OrderRefundedPayload = z.object({
	orderId: z.string().min(1),
	organizationId: z.string().optional(),
	clientId: z.string().optional(),
	refundedAmount: z.number().optional(),
	originalTotal: z.number().optional(),
	reason: z.string().optional(),
	refundedAt: z.number().optional(),
	refundedBy: z.string().optional(),
});
export type OrderRefundedPayload = z.infer<typeof OrderRefundedPayload>;
