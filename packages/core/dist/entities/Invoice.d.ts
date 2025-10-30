import { z } from "zod";
export declare const InvoiceSchema: z.ZodObject<{
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
    warning?: string | undefined;
}>;
export type TInvoice = z.infer<typeof InvoiceSchema>;
export declare function isInvoice(data: unknown): data is TInvoice;
//# sourceMappingURL=Invoice.d.ts.map