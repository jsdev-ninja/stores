import { z } from "zod";
export declare const FavoriteProductSchema: z.ZodObject<{
    type: z.ZodLiteral<"FavoriteProduct">;
    id: z.ZodString;
    companyId: z.ZodString;
    storeId: z.ZodString;
    userId: z.ZodString;
    productId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "FavoriteProduct";
    id: string;
    companyId: string;
    storeId: string;
    userId: string;
    productId: string;
}, {
    type: "FavoriteProduct";
    id: string;
    companyId: string;
    storeId: string;
    userId: string;
    productId: string;
}>;
export type TFavoriteProduct = z.infer<typeof FavoriteProductSchema>;
//# sourceMappingURL=FavoriteProduct.d.ts.map