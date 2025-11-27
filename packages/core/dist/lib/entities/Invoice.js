import { z } from "zod";
import { CalculatedDataSchema } from "./DeliveryNote";
// Main Invoice schema
export const EzInvoiceSchema = z.object({
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
export const InvoiceSchema = z.object({
    id: z.string().min(1, "ID is required"),
    number: z.string().min(1, "Number is required"),
    date: z.string().min(1, "Date is required"),
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
        .array(z.object({
        name: z.string().min(1, "Name is required").optional(),
        price: z.number().min(1, "Price is required").optional(),
        quantity: z.number().min(1, "Quantity is required").optional(),
        total: z.number().min(1, "Total is required").optional(),
    }))
        .optional(),
    total: z.number().min(1, "Total is required").optional(),
    vat: z.number().min(1, "VAT is required").optional(),
    link: z.string().url("Link must be a valid URL").optional(),
});
