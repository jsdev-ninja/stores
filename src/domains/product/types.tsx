import { z } from "zod";

export const ProductSchema = z.object({
	id: z.string(),
	sku: z.string(),
	name: z.string(),
	description: z.string().optional(),
	vat: z.boolean(),
	price: z.number(),
	currency: z.literal("ILS"),
	category: z.string().optional(),
	discount: z
		.object({
			type: z.enum(["number", "percent"]),
			value: z.number(),
		})
		.optional(),
	unit: z.object({
		type: z.enum(["unit", "kg", "gram", "liter", "ml"]),
		value: z.number(),
	}),
	weight: z.object({
		value: z.number(),
		unit: z.enum(["kg", "gram"]),
	}),
	images: z.array(z.object({ url: z.string().url(), id: z.string() })),
	locales: z.array(z.object({ type: z.string(), value: z.string() })),
});

export const NewProductSchema = ProductSchema.omit({ id: true, images: true }).merge(
	z.object({
		image: z.instanceof(FileList).optional(),
	})
);
export type TProduct = z.infer<typeof ProductSchema>;
export type TNewProduct = z.infer<typeof NewProductSchema>;

export type ProductUnitType = "unit" | "kg" | "gram" | "liter" | "ml";
