import { z } from "zod";
export declare const DiscountConditionsSchema: z.ZodOptional<z.ZodObject<{
    minSpend: z.ZodOptional<z.ZodNumber>;
    stackable: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    stackable: boolean;
    minSpend?: number | undefined;
}, {
    minSpend?: number | undefined;
    stackable?: boolean | undefined;
}>>;
export declare const DiscountVariantSchema: z.ZodDiscriminatedUnion<"variantType", [z.ZodObject<{
    variantType: z.ZodLiteral<"bundle">;
    productsId: z.ZodArray<z.ZodString, "many">;
    requiredQuantity: z.ZodNumber;
    bundlePrice: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    variantType: "bundle";
    productsId: string[];
    requiredQuantity: number;
    bundlePrice: number;
}, {
    variantType: "bundle";
    productsId: string[];
    requiredQuantity: number;
    bundlePrice: number;
}>]>;
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
    startDate: z.ZodNumber;
    endDate: z.ZodNumber;
    variant: z.ZodDiscriminatedUnion<"variantType", [z.ZodObject<{
        variantType: z.ZodLiteral<"bundle">;
        productsId: z.ZodArray<z.ZodString, "many">;
        requiredQuantity: z.ZodNumber;
        bundlePrice: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        variantType: "bundle";
        productsId: string[];
        requiredQuantity: number;
        bundlePrice: number;
    }, {
        variantType: "bundle";
        productsId: string[];
        requiredQuantity: number;
        bundlePrice: number;
    }>]>;
    conditions: z.ZodOptional<z.ZodObject<{
        minSpend: z.ZodOptional<z.ZodNumber>;
        stackable: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        stackable: boolean;
        minSpend?: number | undefined;
    }, {
        minSpend?: number | undefined;
        stackable?: boolean | undefined;
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
    startDate: number;
    endDate: number;
    variant: {
        variantType: "bundle";
        productsId: string[];
        requiredQuantity: number;
        bundlePrice: number;
    };
    conditions?: {
        stackable: boolean;
        minSpend?: number | undefined;
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
    startDate: number;
    endDate: number;
    variant: {
        variantType: "bundle";
        productsId: string[];
        requiredQuantity: number;
        bundlePrice: number;
    };
    conditions?: {
        minSpend?: number | undefined;
        stackable?: boolean | undefined;
    } | undefined;
}>;
export type TDiscount = z.infer<typeof DiscountSchema>;
export type DiscountVariant = z.infer<typeof DiscountVariantSchema>;
export type DiscountConditions = z.infer<typeof DiscountConditionsSchema>;
export interface DiscountResult {
    applicable: boolean;
    discountAmount: number;
    affectedItems: Array<{
        productId: string;
        quantity: number;
        originalPrice: number;
        discountedPrice: number;
        discountAmount: number;
    }>;
}
export interface AppliedDiscount {
    discountId: string;
    discountName: string;
    discountAmount: number;
    affectedItems: DiscountResult["affectedItems"];
}
export interface DiscountContext {
    cart: Array<{
        amount: number;
        product: {
            id: string;
            price: number;
        };
    }>;
    user?: Record<string, unknown>;
    appliedDiscounts: AppliedDiscount[];
}
//# sourceMappingURL=types.d.ts.map