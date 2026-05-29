import { z } from "zod";

export const DocumentEventTypes = {
	deliveryNoteCreated: "documents.delivery_note_created",
} as const;

export const DocumentDeliveryNoteCreatedPayload = z.object({
	orderId: z.string().min(1),
	deliveryNoteId: z.string().optional(),
	deliveryNoteNumber: z.string().optional(),
	organizationId: z.string().optional(),
	clientId: z.string().optional(),
	billingAccountId: z.string().nullable().optional(),
	total: z.number().optional(),                 // order.cart.cartTotal (shekels)
	vat: z.number().optional(),                   // order.cart.cartVat (shekels)
	currency: z.literal("ILS").optional(),
	createdAt: z.number().optional(),             // epoch millis
	createdBy: z.string().optional(),             // userId or "system"
});
export type DocumentDeliveryNoteCreatedPayload = z.infer<typeof DocumentDeliveryNoteCreatedPayload>;
