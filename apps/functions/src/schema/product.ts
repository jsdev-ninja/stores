import { z } from "zod";

export const LocaleSchema = z.object({
	lang: z.string().min(1),
	value: z.string().min(1),
});

export const BaseCategorySchema = z.object({
	id: z.string().min(1),
	companyId: z.string().min(1),
	storeId: z.string().min(1),
	parentId: z.string().nullish(),
	tag: z.string().min(1),
	locales: z.array(LocaleSchema),
});

type Category = z.infer<typeof BaseCategorySchema> & {
	children: Category[];
};

export const CategorySchema: z.ZodType<Category> = BaseCategorySchema.extend({
	children: z.lazy(() => CategorySchema.array()),
});

// export type TCategory = z.infer<typeof CategorySchema>;
export type TCategory = z.infer<typeof BaseCategorySchema> & {
	children: TCategory[];
};
export const TFlattenCategorySchema = BaseCategorySchema.extend({
	index: z.number(),
	depth: z.number(),
	collapsed: z.boolean().optional(),
	children: z.array(CategorySchema),
});

export type TFlattenCategory = z.infer<typeof TFlattenCategorySchema>;

export type TNewCategory = Omit<TCategory, "id">;

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

export type TProduct = z.infer<typeof ProductSchema>;

export const ProductAlgoliaSchema = z.object({
	type: z.literal("Product"),
	storeId: text,
	companyId: text,
	id: z.string(),
	objectID: z.string(),
	sku: z.string().min(1),
	description: z.string(),
	vat: z.boolean(),
	priceType: z.enum(["unit", "kg", "gram", "liter", "ml"]),
	priceAmount: z.number(),
	price: z.number(),
	currency: z.literal("ILS"),
	discountPrice: z.number(),
	discountType: z.enum(["number", "percent", "none"]),
	weight: z.string(),
	volume: z.string(),
	image: z.string().url(),
	name: z.string(),
	manufacturer: text,
	brand: z.string(),
	importer: z.string(),
	supplier: z.string(),
	ingredients: z.array(z.string()),
	categories: z.object({
		lvl0: z.array(z.string()),
		lvl1: z.array(z.string()),
		lvl2: z.array(z.string()),
		lvl3: z.array(z.string()),
		lvl4: z.array(z.string()),
	}),
	categoryList: z.array(z.string()),
});

export type TProductAlgolia = z.infer<typeof ProductAlgoliaSchema>;

export function transformProduct(product: TProduct): TProductAlgolia {
	return {
		type: product.type,
		id: product.id,
		objectID: product.id,
		sku: product.sku,
		storeId: product.storeId,
		companyId: product.companyId,
		price: product.price,
		currency: product.currency,
		brand: product.brand,
		categories: product.categories,
		categoryList: product.categoryList.map((c) => c.locales[0].value),
		description: product.description,
		discountPrice: product.discount.value,
		discountType: product.discount.type,
		image: product.images[0]?.url ?? "",
		importer: product.importer,
		ingredients: product.ingredients.map((i) => i.value),
		manufacturer: product.manufacturer,
		name: product.locales[0].value,
		priceAmount: product.priceType.value,
		priceType: product.priceType.type,
		supplier: product.supplier,
		vat: product.vat,
		volume:
			product.volume.unit !== "none" ? `${product.volume.value} ${product.volume.unit}` : "",
		weight:
			product.weight.unit !== "none" ? `${product.weight.value} ${product.weight.unit}` : "",
	};
}
