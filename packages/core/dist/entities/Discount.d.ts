import { z } from "zod";
export declare const DiscountSchema: z.ZodObject<{
    type: z.ZodLiteral<"Discount">;
    storeId: z.ZodString;
    companyId: z.ZodString;
    id: z.ZodString;
    name: z.ZodArray<z.ZodObject<{
        lang: z.ZodEnum<["he"]>;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value: string;
        lang: "he";
    }, {
        value: string;
        lang: "he";
    }>, "many">;
    active: z.ZodBoolean;
    variant: z.ZodDiscriminatedUnion<"variantType", [z.ZodObject<{
        variantType: z.ZodLiteral<"bundle">;
        productsId: z.ZodArray<z.ZodString, "many">;
        requiredQuantity: z.ZodNumber;
        discountPrice: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        variantType: "bundle";
        productsId: string[];
        requiredQuantity: number;
        discountPrice: number;
    }, {
        variantType: "bundle";
        productsId: string[];
        requiredQuantity: number;
        discountPrice: number;
    }>]>;
    image: z.ZodOptional<z.ZodObject<{
        url: z.ZodString;
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        url: string;
    }, {
        id: string;
        url: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "Discount";
    id: string;
    companyId: string;
    storeId: string;
    name: {
        value: string;
        lang: "he";
    }[];
    active: boolean;
    variant: {
        variantType: "bundle";
        productsId: string[];
        requiredQuantity: number;
        discountPrice: number;
    };
    image?: {
        id: string;
        url: string;
    } | undefined;
}, {
    type: "Discount";
    id: string;
    companyId: string;
    storeId: string;
    name: {
        value: string;
        lang: "he";
    }[];
    active: boolean;
    variant: {
        variantType: "bundle";
        productsId: string[];
        requiredQuantity: number;
        discountPrice: number;
    };
    image?: {
        id: string;
        url: string;
    } | undefined;
}>;
export type TDiscount = z.infer<typeof DiscountSchema>;
//# sourceMappingURL=Discount.d.ts.map