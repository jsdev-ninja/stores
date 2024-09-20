import { LocaleSchema } from "src/shared/types";
import { z } from "zod";
import { CategorySchema } from "../Category";
import { positiveNumber } from "src/types";

const text = z.string();
export const ProductSchema = z.object({
	type: z.literal("Product"),
	storeId: text,
	companyId: text,
	id: z.string(),
	objectID: z.string(),
	sku: z.string().min(1),
	description: z.string(),
	vat: z.boolean(),
	priceType: z.object({
		type: z.enum(["unit", "kg", "gram", "liter", "ml"]),
		value: z.number(),
	}),
	price: positiveNumber,
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
	categoryNames: z.array(z.string()),
});

export const NewProductSchema = ProductSchema.omit({
	id: true,
	categories: true,
	images: true,
}).extend({
	image: z.instanceof(File).optional(),
	purchasePrice: z.number().optional(),
	profitPercentage: z.number().optional(),
});
export const EditProductSchema = ProductSchema.extend({
	image: z.instanceof(File).optional(),
	purchasePrice: z.number().optional(),
	profitPercentage: z.number().optional(),
});

export type TNewProduct = z.infer<typeof NewProductSchema>;

export type TEditProduct = z.infer<typeof EditProductSchema>;

export type TProduct = z.infer<typeof ProductSchema>;
