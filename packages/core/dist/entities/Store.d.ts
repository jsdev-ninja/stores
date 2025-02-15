import { z } from "zod";
declare const StoreSchema: z.ZodObject<{
    id: z.ZodString;
    companyId: z.ZodString;
    name: z.ZodString;
    urls: z.ZodArray<z.ZodString, "many">;
    logoUrl: z.ZodString;
    tenantId: z.ZodString;
    hypData: z.ZodObject<{
        masof: z.ZodString;
        password: z.ZodString;
        isJ5: z.ZodEnum<["True", "False"]>;
        KEY: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        KEY: string;
        masof: string;
        password: string;
        isJ5: "True" | "False";
    }, {
        KEY: string;
        masof: string;
        password: string;
        isJ5: "True" | "False";
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    companyId: string;
    name: string;
    tenantId: string;
    urls: string[];
    logoUrl: string;
    hypData: {
        KEY: string;
        masof: string;
        password: string;
        isJ5: "True" | "False";
    };
}, {
    id: string;
    companyId: string;
    name: string;
    tenantId: string;
    urls: string[];
    logoUrl: string;
    hypData: {
        KEY: string;
        masof: string;
        password: string;
        isJ5: "True" | "False";
    };
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