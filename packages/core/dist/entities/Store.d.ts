import { z } from "zod";
declare const StoreSchema: z.ZodObject<{
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
    freeOrderPrice: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    companyId: string;
    name: string;
    tenantId: string;
    paymentType: "external" | "j5";
    urls: string[];
    logoUrl: string;
    allowAnonymousClients: boolean;
    isVatIncludedInPrice: boolean;
    clientTypes: ("company" | "individual")[];
    minimumOrder?: number | undefined;
    freeOrderPrice?: number | undefined;
}, {
    id: string;
    companyId: string;
    name: string;
    tenantId: string;
    paymentType: "external" | "j5";
    urls: string[];
    logoUrl: string;
    allowAnonymousClients: boolean;
    isVatIncludedInPrice: boolean;
    clientTypes: ("company" | "individual")[];
    minimumOrder?: number | undefined;
    freeOrderPrice?: number | undefined;
}>;
export type TStore = z.infer<typeof StoreSchema>;
export {};
//# sourceMappingURL=Store.d.ts.map