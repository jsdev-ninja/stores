import { z } from "zod";

export const DocumentEventTypes = {
	deliveryNoteCreated: "documents.delivery_note_created",
	invoiceCreated: "documents.invoice_created",
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

// ---------------------------------------------------------------------------
// documents.invoice_created
// Emitted after createInvoice succeeds. When the invoice was created from a
// delivery note (params.parent set), deliveryNoteNumber is present.
// ---------------------------------------------------------------------------
export const DocumentInvoiceCreatedPayload = z.object({
	orderId: z.string().min(1),
	invoiceNumber: z.string().min(1),
	invoiceDocUuid: z.string().min(1),
	/** Integer agorot (1 ILS = 100 agorot), always positive */
	amount: z.number().int().positive(),
	companyId: z.string().min(1),
	storeId: z.string().min(1),
	/** Present iff invoice was created from a delivery note (params.parent set) */
	deliveryNoteNumber: z.string().optional(),
	organizationId: z.string().optional(),
	/** חשבונית ישראל allocation number, if captured at call time */
	allocationNumber: z.string().optional(),
});
export type DocumentInvoiceCreatedPayload = z.infer<typeof DocumentInvoiceCreatedPayload>;
