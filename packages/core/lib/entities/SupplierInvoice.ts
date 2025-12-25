import { z } from "zod";
import { SupplierSchema } from "./Supplier";

export const SupplierInvoiceSchema = z.object({
	type: z.literal("SupplierInvoice"),
	id: z.string(),
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
});

export const NewSupplierInvoiceSchema = SupplierInvoiceSchema.omit({ id: true });

export type TNewSupplierInvoice = z.infer<typeof NewSupplierInvoiceSchema>;
export type TSupplierInvoice = z.infer<typeof SupplierInvoiceSchema>;
