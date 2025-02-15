import { z } from "zod";
export declare const BaseCategorySchema: z.ZodObject<{
    id: z.ZodString;
    companyId: z.ZodString;
    storeId: z.ZodString;
    parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    tag: z.ZodString;
    locales: z.ZodArray<z.ZodObject<{
        lang: z.ZodEnum<["he"]>;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value: string;
        lang: "he";
    }, {
        value: string;
        lang: "he";
    }>, "many">;
    depth: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    companyId: string;
    storeId: string;
    tag: string;
    locales: {
        value: string;
        lang: "he";
    }[];
    depth: number;
    parentId?: string | null | undefined;
}, {
    id: string;
    companyId: string;
    storeId: string;
    tag: string;
    locales: {
        value: string;
        lang: "he";
    }[];
    depth: number;
    parentId?: string | null | undefined;
}>;
type Category = z.infer<typeof BaseCategorySchema> & {
    children: Category[];
};
export declare const CategorySchema: z.ZodType<Category>;
export type TCategory = z.infer<typeof BaseCategorySchema> & {
    children: TCategory[];
};
export declare const TFlattenCategorySchema: z.ZodObject<z.objectUtil.extendShape<{
    id: z.ZodString;
    companyId: z.ZodString;
    storeId: z.ZodString;
    parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    tag: z.ZodString;
    locales: z.ZodArray<z.ZodObject<{
        lang: z.ZodEnum<["he"]>;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value: string;
        lang: "he";
    }, {
        value: string;
        lang: "he";
    }>, "many">;
    depth: z.ZodNumber;
}, {
    index: z.ZodNumber;
    depth: z.ZodNumber;
    collapsed: z.ZodOptional<z.ZodBoolean>;
    children: z.ZodArray<z.ZodType<Category, z.ZodTypeDef, Category>, "many">;
}>, "strip", z.ZodTypeAny, {
    id: string;
    companyId: string;
    storeId: string;
    tag: string;
    locales: {
        value: string;
        lang: "he";
    }[];
    depth: number;
    children: Category[];
    index: number;
    parentId?: string | null | undefined;
    collapsed?: boolean | undefined;
}, {
    id: string;
    companyId: string;
    storeId: string;
    tag: string;
    locales: {
        value: string;
        lang: "he";
    }[];
    depth: number;
    children: Category[];
    index: number;
    parentId?: string | null | undefined;
    collapsed?: boolean | undefined;
}>;
export type TFlattenCategory = z.infer<typeof TFlattenCategorySchema>;
export type TNewCategory = Omit<TCategory, "id">;
export {};
//# sourceMappingURL=Category.d.ts.map