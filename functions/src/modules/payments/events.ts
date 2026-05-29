import { z } from "zod";

export const PaymentEventTypes = {
	received: "payment.received",
	refunded: "payment.refunded",
	failed: "payment.failed",
} as const;

export const PaymentReceivedPayload = z.object({
	paymentId: z.string().min(1),
	orderId: z.string().optional(),
	organizationId: z.string().optional(),
	clientId: z.string().optional(),
	amount: z.number().optional(),                    // positive number, shekels
	currency: z.literal("ILS").optional(),
	paymentMethod: z.string().optional(),             // e.g. "credit_card", "bank_transfer", "cash"
	provider: z.string().optional(),                  // e.g. "hyp", "j5", "manual"
	providerReference: z.string().optional(),         // gateway transaction id
	paymentDate: z.number().optional(),               // epoch millis
	receivedBy: z.string().optional(),                // userId or "system"
});
export type PaymentReceivedPayload = z.infer<typeof PaymentReceivedPayload>;

export const PaymentRefundedPayload = z.object({
	paymentId: z.string().min(1),                     // the refund's own id
	originalPaymentId: z.string().optional(),         // the payment being refunded
	orderId: z.string().optional(),
	organizationId: z.string().optional(),
	clientId: z.string().optional(),
	refundedAmount: z.number().optional(),            // positive number
	currency: z.literal("ILS").optional(),
	provider: z.string().optional(),
	providerReference: z.string().optional(),
	reason: z.string().optional(),
	refundedAt: z.number().optional(),
	refundedBy: z.string().optional(),
});
export type PaymentRefundedPayload = z.infer<typeof PaymentRefundedPayload>;

export const PaymentFailedPayload = z.object({
	paymentId: z.string().min(1),
	orderId: z.string().optional(),
	organizationId: z.string().optional(),
	clientId: z.string().optional(),
	amount: z.number().optional(),
	currency: z.literal("ILS").optional(),
	provider: z.string().optional(),
	providerReference: z.string().optional(),
	errorCode: z.string().optional(),
	errorMessage: z.string().optional(),
	failedAt: z.number().optional(),
});
export type PaymentFailedPayload = z.infer<typeof PaymentFailedPayload>;
