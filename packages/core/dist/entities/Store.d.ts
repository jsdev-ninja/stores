import { z } from "zod";
declare const StoreSchema: z.ZodObject<{
    id: z.ZodString;
    companyId: z.ZodString;
    name: z.ZodString;
    urls: z.ZodArray<z.ZodString, "many">;
    logoUrl: z.ZodString;
    tenantId: z.ZodString;
    paymentType: z.ZodEnum<["external", "j5"]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    companyId: string;
    name: string;
    tenantId: string;
    paymentType: "external" | "j5";
    urls: string[];
    logoUrl: string;
}, {
    id: string;
    companyId: string;
    name: string;
    tenantId: string;
    paymentType: "external" | "j5";
    urls: string[];
    logoUrl: string;
}>;
export type TStore = z.infer<typeof StoreSchema>;
export {};
//# sourceMappingURL=Store.d.ts.map