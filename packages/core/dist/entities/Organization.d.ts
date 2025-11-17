import { z } from "zod";
export declare const BillingAccountSchema: z.ZodObject<{
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
}>;
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
    paymentType: z.ZodEnum<["default", "delayed"]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    paymentType: "default" | "delayed";
    billingAccounts: {
        number: string;
        id: string;
        name: string;
    }[];
    discountPercentage?: number | undefined;
    nameOnInvoice?: string | undefined;
}, {
    id: string;
    name: string;
    paymentType: "default" | "delayed";
    billingAccounts: {
        number: string;
        id: string;
        name: string;
    }[];
    discountPercentage?: number | undefined;
    nameOnInvoice?: string | undefined;
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
    paymentType: z.ZodEnum<["default", "delayed"]>;
}, "id">, "strip", z.ZodTypeAny, {
    name: string;
    paymentType: "default" | "delayed";
    billingAccounts: {
        number: string;
        id: string;
        name: string;
    }[];
    discountPercentage?: number | undefined;
    nameOnInvoice?: string | undefined;
}, {
    name: string;
    paymentType: "default" | "delayed";
    billingAccounts: {
        number: string;
        id: string;
        name: string;
    }[];
    discountPercentage?: number | undefined;
    nameOnInvoice?: string | undefined;
}>;
export type TBillingAccount = z.infer<typeof BillingAccountSchema>;
export type TNewOrganization = z.infer<typeof NewOrganizationSchema>;
export type TOrganization = z.infer<typeof OrganizationSchema>;
//# sourceMappingURL=Organization.d.ts.map