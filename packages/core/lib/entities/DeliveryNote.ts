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

export const EzDeliveryNoteSchema = z.object({
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

export const DeliveryNoteSchema = z.object({
	id: z.string().min(1, "ID is required"),
	number: z.string().min(1, "Number is required"),
	date: z.number().min(1, "Date is required"),
	createdAt: z.number().min(1, "Created at is required"),
	status: z.enum(["pending", "paid", "cancelled"]),
	companyDetails: z
		.object({
			name: z.string().min(1, "Name is required").optional(),
			address: z.string().min(1, "Address is required").optional(),
			phone: z.string().min(1, "Phone is required").optional(),
			email: z.string().email("Email must be valid").optional(),
		})
		.optional(),
	clientDetails: z
		.object({
			name: z.string().min(1, "Name is required").optional(),
			address: z.string().min(1, "Address is required").optional(),
			phone: z.string().min(1, "Phone is required").optional(),
			email: z.string().email("Email must be valid").optional(),
		})
		.optional(),
	items: z
		.array(
			z.object({
				name: z.string().min(1, "Name is required").optional(),
				price: z.number().min(1, "Price is required").optional(),
				quantity: z.number().min(1, "Quantity is required").optional(),
				total: z.number().min(1, "Total is required").optional(),
			})
		)
		.optional(),
	total: z.number().min(1, "Total is required").optional(),
	vat: z.number().min(1, "VAT is required").optional(),
	link: z.string().url("Link must be a valid URL").optional(),
});
// Type inference
export type TEzDeliveryNote = z.infer<typeof EzDeliveryNoteSchema>;
export type TDeliveryNote = z.infer<typeof DeliveryNoteSchema>;
export type TCalculatedData = z.infer<typeof CalculatedDataSchema>;
