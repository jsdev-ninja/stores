import { z } from "zod";
import { LocaleSchema } from "./Locale";
import { CategorySchema } from "./Category";
const text = z.string();
export const ProductSchema = z.object({
    type: z.literal("Product"),
    storeId: text,
    companyId: text,
    id: z.string(),
    objectID: z.string(),
    sku: z.string().min(1),
    name: z.array(LocaleSchema),
    description: z.array(LocaleSchema),
    isPublished: z.boolean(),
    vat: z.boolean(),
    priceType: z.object({
        type: z.enum(["unit", "kg", "gram", "liter", "ml"]),
        value: z.number(),
    }),
    price: z.number().positive(),
    purchasePrice: z.number().optional(),
    profitPercentage: z.number().optional(),
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
    manufacturer: text,
    brand: z.string(),
    importer: z.string(),
    supplier: z.string(),
    ingredients: z.array(LocaleSchema),
    created_at: z.number(),
    updated_at: z.number(),
    categoryList: z.array(CategorySchema),
    // generated
    categories: z.object({
        lvl0: z.array(z.string()),
        lvl1: z.array(z.string()),
        lvl2: z.array(z.string()),
        lvl3: z.array(z.string()),
        lvl4: z.array(z.string()),
    }),
    categoryNames: z.array(z.string()),
});
export const NewProductSchema = ProductSchema.omit({
    id: true,
    categories: true,
    images: true,
}).extend({
    image: z.instanceof(File).optional(),
});
export const EditProductSchema = ProductSchema.extend({
    image: z.instanceof(File).optional(),
});
