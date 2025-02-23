import { z } from "zod";
export declare const CompanySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    websiteDomains: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    websiteDomains: string[];
}, {
    id: string;
    name: string;
    websiteDomains: string[];
}>;
export type TCompany = z.infer<typeof CompanySchema>;
//# sourceMappingURL=Company.d.ts.map