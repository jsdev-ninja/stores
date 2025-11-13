import { z } from "zod";
import { CalculatedDataSchema } from "./DeliveryNote";

// Main Invoice schema
export const InvoiceSchema = z.object({
	doc_uuid: z.string().uuid("Document UUID must be a valid UUID"),
	pdf_link: z.string().url("PDF link must be a valid URL"),
	pdf_link_copy: z.string().url("PDF copy link must be a valid URL"),
	doc_number: z.string().min(1, "Document number is required"),
	sent_mails: z.array(z.string().email("Each email must be valid")),
	success: z.boolean(),
	ua_uuid: z.string().uuid("UA UUID must be a valid UUID"),
	calculatedData: CalculatedDataSchema,
	warning: z.string().optional(),
	date: z.number().optional(),
});

// Type inference
export type TInvoice = z.infer<typeof InvoiceSchema>;

// Validation functions
export function isInvoice(data: unknown): data is TInvoice {
	return InvoiceSchema.safeParse(data).success;
}
