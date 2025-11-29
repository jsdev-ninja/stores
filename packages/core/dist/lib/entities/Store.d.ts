import { z } from "zod";
export declare const clientTypesSchema: z.ZodEnum<["individual", "company"]>;
export declare const StoreSchema: z.ZodObject<{
    id: z.ZodString;
    companyId: z.ZodString;
    name: z.ZodString;
    urls: z.ZodArray<z.ZodString, "many">;
    logoUrl: z.ZodString;
    tenantId: z.ZodString;
    paymentType: z.ZodEnum<["external", "j5"]>;
    allowAnonymousClients: z.ZodBoolean;
    isVatIncludedInPrice: z.ZodBoolean;
    clientTypes: z.ZodArray<z.ZodEnum<["individual", "company"]>, "many">;
    minimumOrder: z.ZodOptional<z.ZodNumber>;
    freeDeliveryPrice: z.ZodOptional<z.ZodNumber>;
    deliveryPrice: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    companyId: string;
    name: string;
    tenantId: string;
    paymentType: "external" | "j5";
    isVatIncludedInPrice: boolean;
    urls: string[];
    logoUrl: string;
    allowAnonymousClients: boolean;
    clientTypes: ("company" | "individual")[];
    deliveryPrice?: number | undefined;
    freeDeliveryPrice?: number | undefined;
    minimumOrder?: number | undefined;
}, {
    id: string;
    companyId: string;
    name: string;
    tenantId: string;
    paymentType: "external" | "j5";
    isVatIncludedInPrice: boolean;
    urls: string[];
    logoUrl: string;
    allowAnonymousClients: boolean;
    clientTypes: ("company" | "individual")[];
    deliveryPrice?: number | undefined;
    freeDeliveryPrice?: number | undefined;
    minimumOrder?: number | undefined;
}>;
export type TStore = z.infer<typeof StoreSchema>;
//# sourceMappingURL=Store.d.ts.map