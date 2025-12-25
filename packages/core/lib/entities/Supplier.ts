import { z } from "zod";

export const SupplierSchema = z.object({
	type: z.literal("Supplier"),
	id: z.string(),
	name: z.string(),
	code: z.string(), // supplier code number
});

export const NewSupplierSchema = SupplierSchema.omit({ id: true });

export type TNewSupplier = z.infer<typeof NewSupplierSchema>;
export type TSupplier = z.infer<typeof SupplierSchema>;
