import { LocaleSchema } from "src/shared/types";
import { z } from "zod";
import { CategorySchema } from "../Category";

const text = z.string();
export const ProductSchema = z.object({
	storeId: text,
	companyId: text,
	id: z.string(),
	sku: text,
	description: z.string().optional(),
	vat: z.boolean(),
	priceType: z.object({
		type: z.enum(["unit", "kg", "gram", "liter", "ml"]),
		value: z.number(),
	}),
	price: z.number(),
	currency: z.literal("ILS"),
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
	manufacturer: text.optional(),
	brand: z.string().optional(),
	importer: z.string().optional(),
	supplier: z.string().optional(),
	ingredients: z.array(LocaleSchema),

	// algolia
	objectID: z.string(),
	categories: z.object({
		lvl0: z.array(z.string()),
		lvl1: z.array(z.string()),
		lvl2: z.array(z.string()),
		lvl3: z.array(z.string()),
		lvl4: z.array(z.string()),
	}),
	categoryList: z.array(CategorySchema),
});

export type TProduct = z.infer<typeof ProductSchema>;
