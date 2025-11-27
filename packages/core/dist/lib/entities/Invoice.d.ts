import { z } from "zod";
export declare const EzInvoiceSchema: z.ZodObject<{
    doc_uuid: z.ZodString;
    pdf_link: z.ZodString;
    pdf_link_copy: z.ZodString;
    doc_number: z.ZodString;
    sent_mails: z.ZodArray<z.ZodString, "many">;
    success: z.ZodBoolean;
    ua_uuid: z.ZodString;
    calculatedData: z.ZodObject<{
        _COMMENT: z.ZodOptional<z.ZodString>;
        transaction_id: z.ZodString;
        date: z.ZodString;
        currency: z.ZodString;
        rate: z.ZodNumber;
        vat: z.ZodString;
        vat_price: z.ZodNumber;
        price_discount: z.ZodNumber;
        price_discount_in_currency: z.ZodNumber;
        price_total: z.ZodString;
        price_total_in_currency: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        date: string;
        vat: string;
        currency: string;
        transaction_id: string;
        rate: number;
        vat_price: number;
        price_discount: number;
        price_discount_in_currency: number;
        price_total: string;
        price_total_in_currency: number;
        _COMMENT?: string | undefined;
    }, {
        date: string;
        vat: string;
        currency: string;
        transaction_id: string;
        rate: number;
        vat_price: number;
        price_discount: number;
        price_discount_in_currency: number;
        price_total: string;
        price_total_in_currency: number;
        _COMMENT?: string | undefined;
    }>;
    warning: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    doc_uuid: string;
    pdf_link: string;
    pdf_link_copy: string;
    doc_number: string;
    sent_mails: string[];
    success: boolean;
    ua_uuid: string;
    calculatedData: {
        date: string;
        vat: string;
        currency: string;
        transaction_id: string;
        rate: number;
        vat_price: number;
        price_discount: number;
        price_discount_in_currency: number;
        price_total: string;
        price_total_in_currency: number;
        _COMMENT?: string | undefined;
    };
    date?: number | undefined;
    warning?: string | undefined;
}, {
    doc_uuid: string;
    pdf_link: string;
    pdf_link_copy: string;
    doc_number: string;
    sent_mails: string[];
    success: boolean;
    ua_uuid: string;
    calculatedData: {
        date: string;
        vat: string;
        currency: string;
        transaction_id: string;
        rate: number;
        vat_price: number;
        price_discount: number;
        price_discount_in_currency: number;
        price_total: string;
        price_total_in_currency: number;
        _COMMENT?: string | undefined;
    };
    date?: number | undefined;
    warning?: string | undefined;
}>;
export declare const InvoiceSchema: z.ZodObject<{
    id: z.ZodString;
    number: z.ZodString;
    date: z.ZodString;
    createdAt: z.ZodNumber;
    status: z.ZodEnum<["pending", "paid", "cancelled"]>;
    companyDetails: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        email?: string | undefined;
        address?: string | undefined;
        phone?: string | undefined;
    }, {
        name?: string | undefined;
        email?: string | undefined;
        address?: string | undefined;
        phone?: string | undefined;
    }>>;
    clientDetails: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        email?: string | undefined;
        address?: string | undefined;
        phone?: string | undefined;
    }, {
        name?: string | undefined;
        email?: string | undefined;
        address?: string | undefined;
        phone?: string | undefined;
    }>>;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodNumber>;
        quantity: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        price?: number | undefined;
        quantity?: number | undefined;
        total?: number | undefined;
    }, {
        name?: string | undefined;
        price?: number | undefined;
        quantity?: number | undefined;
        total?: number | undefined;
    }>, "many">>;
    total: z.ZodOptional<z.ZodNumber>;
    vat: z.ZodOptional<z.ZodNumber>;
    link: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    number: string;
    status: "pending" | "paid" | "cancelled";
    id: string;
    date: string;
    createdAt: number;
    vat?: number | undefined;
    items?: {
        name?: string | undefined;
        price?: number | undefined;
        quantity?: number | undefined;
        total?: number | undefined;
    }[] | undefined;
    companyDetails?: {
        name?: string | undefined;
        email?: string | undefined;
        address?: string | undefined;
        phone?: string | undefined;
    } | undefined;
    clientDetails?: {
        name?: string | undefined;
        email?: string | undefined;
        address?: string | undefined;
        phone?: string | undefined;
    } | undefined;
    total?: number | undefined;
    link?: string | undefined;
}, {
    number: string;
    status: "pending" | "paid" | "cancelled";
    id: string;
    date: string;
    createdAt: number;
    vat?: number | undefined;
    items?: {
        name?: string | undefined;
        price?: number | undefined;
        quantity?: number | undefined;
        total?: number | undefined;
    }[] | undefined;
    companyDetails?: {
        name?: string | undefined;
        email?: string | undefined;
        address?: string | undefined;
        phone?: string | undefined;
    } | undefined;
    clientDetails?: {
        name?: string | undefined;
        email?: string | undefined;
        address?: string | undefined;
        phone?: string | undefined;
    } | undefined;
    total?: number | undefined;
    link?: string | undefined;
}>;
export type TInvoice = z.infer<typeof InvoiceSchema>;
export type TEzInvoice = z.infer<typeof EzInvoiceSchema>;
//# sourceMappingURL=Invoice.d.ts.map