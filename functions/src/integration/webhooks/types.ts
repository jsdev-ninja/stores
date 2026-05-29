import { z } from "zod";

export const WebhookSubscriptionSchema = z.object({
	id: z.string().min(1),
	companyId: z.string().min(1),
	storeId: z.string().min(1),

	/** Destination URL the merchant wants events POSTed to. */
	url: z.string().url(),

	/** Shared secret for HMAC-SHA256 signing of the request body. */
	secret: z.string().min(16),

	/** Event types to deliver. Use ["*"] for all events. */
	eventTypes: z.array(z.string().min(1)).min(1),

	/** Whether this subscription is currently active. */
	enabled: z.boolean(),

	/** Last delivery attempt outcome — null until the first attempt. */
	lastDelivery: z
		.object({
			eventId: z.string(),
			eventType: z.string(),
			status: z.enum(["success", "failed"]),
			httpStatus: z.number().nullable(),
			error: z.string().nullable(),
			attemptedAt: z.number(),
		})
		.nullable(),

	/** Running count of consecutive delivery failures. Reset on first success. */
	consecutiveFailures: z.number(),

	createdAt: z.number(),
	updatedAt: z.number(),
	createdBy: z.string(),
});

export type TWebhookSubscription = z.infer<typeof WebhookSubscriptionSchema>;
