import { z } from "zod";

export const LocaleSchema = z.object({
	lang: z.string().min(1),
	value: z.string().min(1),
});

export const BaseCategorySchema = z.object({
	id: z.string().min(1),
	companyId: z.string().min(1),
	storeId: z.string().min(1),
	parentId: z.string().nullish().optional(),
	tag: z.string().min(1),
	locales: z.array(LocaleSchema),
});

export const CategorySchema = BaseCategorySchema.extend({
	children: z.lazy(() => CategorySchema.array()),
});

const text = z.string();
export const ProductSchema = z.object({
	type: z.literal("Product"),
	storeId: text,
	companyId: text,
	id: z.string(),
	sku: z.string().min(1),
	description: z.string(),
	vat: z.boolean(),
	priceType: z.object({
		type: z.enum(["unit", "kg", "gram", "liter", "ml"]),
		value: z.number(),
	}),
	price: z.number(),
	currency: z.literal("ILS"),
	discount: z.object({
		type: z.enum(["number", "percent", "none"]),
		value: z.number(),
	}),
	weight: z.object({
		value: z.number(),
		unit: z.enum(["kg", "gram", "none"]),
	}),
	volume: z.object({
		value: z.number(),
		unit: z.enum(["liter", "ml", "none"]),
	}),
	images: z.array(z.object({ url: z.string().url(), id: z.string() })),
	locales: z.array(LocaleSchema),
	manufacturer: text,
	brand: z.string(),
	importer: z.string(),
	supplier: z.string(),
	ingredients: z.array(LocaleSchema),

	// algolia
	categories: z.object({
		lvl0: z.array(z.string()),
		lvl1: z.array(z.string()),
		lvl2: z.array(z.string()),
		lvl3: z.array(z.string()),
		lvl4: z.array(z.string()),
	}),
	categoryList: z.array(CategorySchema),
});
