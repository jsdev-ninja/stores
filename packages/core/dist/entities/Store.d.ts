import { z } from "zod";
declare const StoreSchema: z.ZodObject<{
    id: z.ZodString;
    companyId: z.ZodString;
    name: z.ZodString;
    urls: z.ZodArray<z.ZodString, "many">;
    logoUrl: z.ZodString;
    tenantId: z.ZodString;
    paymentMethods: z.ZodOptional<z.ZodArray<z.ZodObject<{
        clientType: z.ZodEnum<["user", "company"]>;
        method: z.ZodEnum<["internal", "external"]>;
    }, "strip", z.ZodTypeAny, {
        clientType: "user" | "company";
        method: "internal" | "external";
    }, {
        clientType: "user" | "company";
        method: "internal" | "external";
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    companyId: string;
    tenantId: string;
    name: string;
    urls: string[];
    logoUrl: string;
    paymentMethods?: {
        clientType: "user" | "company";
        method: "internal" | "external";
    }[] | undefined;
}, {
    id: string;
    companyId: string;
    tenantId: string;
    name: string;
    urls: string[];
    logoUrl: string;
    paymentMethods?: {
        clientType: "user" | "company";
        method: "internal" | "external";
    }[] | undefined;
}>;
export declare const StorePrivateSchema: z.ZodObject<{
    storeEmail: z.ZodString;
}, "strip", z.ZodTypeAny, {
    storeEmail: string;
}, {
    storeEmail: string;
}>;
export type TStore = z.infer<typeof StoreSchema>;
export type TStorePrivate = z.infer<typeof StorePrivateSchema>;
export {};
//# sourceMappingURL=Store.d.ts.map