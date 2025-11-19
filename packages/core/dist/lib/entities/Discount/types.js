import { z } from "zod";
// Simple discount conditions
export const DiscountConditionsSchema = z
    .object({
    minSpend: z.number().positive().optional(),
    stackable: z.boolean().default(false),
})
    .optional();
// Bundle discount - buy X items for Y price
export const DiscountVariantSchema = z.discriminatedUnion("variantType", [
    z.object({
        variantType: z.literal("bundle"),
        productsId: z.array(z.string().nonempty()).min(1), // Which products are included
        requiredQuantity: z.number().positive(), // How many items needed (e.g., 3)
        bundlePrice: z.number().positive(), // Total price for the bundle (e.g., $25)
    }),
]);
export const DiscountSchema = z.object({
    type: z.literal("Discount"),
    storeId: z.string().min(1),
    companyId: z.string().min(1),
    id: z.string().min(1),
    name: z.array(z.object({ lang: z.enum(["he"]), value: z.string().nonempty() })),
    active: z.boolean(),
    startDate: z.number(),
    endDate: z.number(),
    variant: DiscountVariantSchema,
    conditions: DiscountConditionsSchema,
});
