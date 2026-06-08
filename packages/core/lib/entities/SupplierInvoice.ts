import { z } from "zod";
import { SupplierSchema } from "./Supplier";

export const SupplierInvoiceSchema = z.object({
	type: z.literal("SupplierInvoice"),
	id: z.string(),
	// "draft" = work-in-progress, NOT yet finalized. Product prices are only
	// updated once the invoice is finalized ("completed"). Legacy invoices have
	// no status and are treated as finalized.
	status: z.enum(["draft", "completed"]).optional(),
	supplier: SupplierSchema,
	invoiceNumber: z.string(),
	date: z.number(),
	rows: z.array(
		z.object({
			id: z.string(),
			rowNumber: z.number(),
			sku: z.string(),
			itemName: z.string(),
			quantity: z.number(),
			purchasePrice: z.number(),
			lineDiscount: z.number(),
			profitPercentage: z.number(),
			price: z.number(),
			totalPurchasePrice: z.number(),
			vat: z.boolean(),
			originalProduct: z
				.object({
					purchasePrice: z.number(),
					price: z.number(),
					profitPercentage: z.number(),
				})
				.optional(),
		})
	),
	productsToUpdate: z.array(
		z.object({
			sku: z.string(),
			itemName: z.string(),
			oldPurchasePrice: z.number(),
			newPurchasePrice: z.number(),
			oldPrice: z.number(),
			newPrice: z.number(),
			oldProfitPercentage: z.number(),
			newProfitPercentage: z.number(),
		})
	),
	total: z.number().optional(),
	totalBeforeVat: z.number().optional(),
	vat: z.number().optional(),
});

export const NewSupplierInvoiceSchema = SupplierInvoiceSchema.omit({ id: true });

export type TSupplierInvoice = z.infer<typeof SupplierInvoiceSchema>;
