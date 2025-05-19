import { z } from "zod";
import { LocaleSchema } from "./Locale";

export const BaseCategorySchema = z.object({
	id: z.string().min(1),
	companyId: z.string().min(1),
	storeId: z.string().min(1),
	parentId: z.string().nullish(),
	tag: z.string().optional(),
	locales: z.array(LocaleSchema),
	depth: z.number(),
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
