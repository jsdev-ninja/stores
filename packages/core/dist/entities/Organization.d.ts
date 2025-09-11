import { z } from "zod";
export declare const OrganizationSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    discountPercentage: z.ZodOptional<z.ZodNumber>;
    nameOnInvoice: z.ZodOptional<z.ZodString>;
    billingAccounts: z.ZodArray<z.ZodObject<{
        number: z.ZodString;
        name: z.ZodString;
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        number: string;
        id: string;
        name: string;
    }, {
        number: string;
        id: string;
        name: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    billingAccounts: {
        number: string;
        id: string;
        name: string;
    }[];
    nameOnInvoice?: string | undefined;
    discountPercentage?: number | undefined;
}, {
    id: string;
    name: string;
    billingAccounts: {
        number: string;
        id: string;
        name: string;
    }[];
    nameOnInvoice?: string | undefined;
    discountPercentage?: number | undefined;
}>;
export declare const NewOrganizationSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    name: z.ZodString;
    discountPercentage: z.ZodOptional<z.ZodNumber>;
    nameOnInvoice: z.ZodOptional<z.ZodString>;
    billingAccounts: z.ZodArray<z.ZodObject<{
        number: z.ZodString;
        name: z.ZodString;
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        number: string;
        id: string;
        name: string;
    }, {
        number: string;
        id: string;
        name: string;
    }>, "many">;
}, "id">, "strip", z.ZodTypeAny, {
    name: string;
    billingAccounts: {
        number: string;
        id: string;
        name: string;
    }[];
    nameOnInvoice?: string | undefined;
    discountPercentage?: number | undefined;
}, {
    name: string;
    billingAccounts: {
        number: string;
        id: string;
        name: string;
    }[];
    nameOnInvoice?: string | undefined;
    discountPercentage?: number | undefined;
}>;
export type TNewOrganization = z.infer<typeof NewOrganizationSchema>;
export type TOrganization = z.infer<typeof OrganizationSchema>;
//# sourceMappingURL=Organization.d.ts.map