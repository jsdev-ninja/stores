import { LocaleSchema } from "src/shared/types";
import { z } from "zod";

export const ProductSchema = z.object({
	id: z.string(),
	sku: z.string(),
	description: z.string().optional(),
	vat: z.boolean(),
	unit: z.object({
		type: z.enum(["unit", "kg", "gram", "liter", "ml"]),
		value: z.number(),
	}),
	price: z.number(),
	currency: z.literal("ILS"),
	categories: z.array(
		z.object({
			tag: z.string(),
			id: z.string(),
		})
	),
	discount: z
		.object({
			type: z.enum(["number", "percent"]),
			value: z.number(),
		})
		.optional(),

	weight: z
		.object({
			value: z.number(),
			unit: z.enum(["kg", "gram"]),
		})
		.optional(),
	volume: z
		.object({
			value: z.number(),
			unit: z.enum(["liter", "ml"]),
		})
		.optional(),
	images: z.array(z.object({ url: z.string().url(), id: z.string() })),
	locales: z.array(LocaleSchema),
});

export const NewProductSchema = ProductSchema.omit({ id: true, images: true }).merge(
	z.object({
		image: z.instanceof(FileList).optional(),
	})
);
export type TProduct = z.infer<typeof ProductSchema>;
export type TNewProduct = z.infer<typeof NewProductSchema>;

export type ProductUnitType = "unit" | "kg" | "gram" | "liter" | "ml";
