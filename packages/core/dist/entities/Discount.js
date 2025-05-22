import { z } from "zod";
import { LocaleSchema } from "./Locale";
const text = z.string().min(1);
export const DiscountSchema = z.object({
    type: z.literal("Discount"),
    storeId: text,
    companyId: text,
    id: text,
    name: z.array(LocaleSchema),
    active: z.boolean(),
    variant: z.discriminatedUnion("variantType", [
        z.object({
            variantType: z.literal("bundle"),
            productsId: z.array(z.string()).min(1),
            requiredQuantity: z.number().positive(),
            discountPrice: z.number().positive(),
        }),
    ]),
    image: z.object({ url: z.string().url(), id: z.string() }).optional(),
});
