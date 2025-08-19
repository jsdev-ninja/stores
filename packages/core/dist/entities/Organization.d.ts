import { z } from "zod";
export declare const OrganizationSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    discountPercentage: z.ZodOptional<z.ZodNumber>;
    nameOnInvoice: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    nameOnInvoice?: string | undefined;
    discountPercentage?: number | undefined;
}, {
    id: string;
    name: string;
    nameOnInvoice?: string | undefined;
    discountPercentage?: number | undefined;
}>;
export declare const NewOrganizationSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    name: z.ZodString;
    discountPercentage: z.ZodOptional<z.ZodNumber>;
    nameOnInvoice: z.ZodOptional<z.ZodString>;
}, "id">, "strip", z.ZodTypeAny, {
    name: string;
    nameOnInvoice?: string | undefined;
    discountPercentage?: number | undefined;
}, {
    name: string;
    nameOnInvoice?: string | undefined;
    discountPercentage?: number | undefined;
}>;
export type TNewOrganization = z.infer<typeof NewOrganizationSchema>;
export type TOrganization = z.infer<typeof OrganizationSchema>;
//# sourceMappingURL=Organization.d.ts.map