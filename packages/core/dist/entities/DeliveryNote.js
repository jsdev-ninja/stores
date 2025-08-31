import { z } from "zod";
// Schema for the calculated data section
export const CalculatedDataSchema = z.object({
    _COMMENT: z.string().optional(),
    transaction_id: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    currency: z.string().length(3, "Currency must be 3 characters"),
    rate: z.number().positive(),
    vat: z.string().regex(/^\d+\.\d{2}$/, "VAT must be in format XX.XX"),
    vat_price: z.number().positive(),
    price_discount: z.number(),
    price_discount_in_currency: z.number(),
    price_total: z.string().regex(/^\d+\.\d{2}$/, "Price total must be in format XX.XX"),
    price_total_in_currency: z.number().positive(),
});
// Main DeliveryNote schema
export const DeliveryNoteSchema = z.object({
    doc_uuid: z.string().uuid("Document UUID must be a valid UUID"),
    pdf_link: z.string().url("PDF link must be a valid URL"),
    pdf_link_copy: z.string().url("PDF copy link must be a valid URL"),
    doc_number: z.string().min(1, "Document number is required"),
    sent_mails: z.array(z.string().email("Each email must be valid")),
    success: z.boolean(),
    ua_uuid: z.string().uuid("UA UUID must be a valid UUID"),
    calculatedData: CalculatedDataSchema,
    warning: z.string().optional(),
});
// Validation functions
export function isDeliveryNote(data) {
    return DeliveryNoteSchema.safeParse(data).success;
}
export function isCalculatedData(data) {
    return CalculatedDataSchema.safeParse(data).success;
}
