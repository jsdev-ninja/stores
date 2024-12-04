import { z } from "zod";
export declare const PaymentSchema: z.ZodObject<{
    id: z.ZodString;
    orderId: z.ZodString;
    amount: z.ZodNumber;
    method: z.ZodEnum<["credit_card", "paypal", "bank_transfer"]>;
    status: z.ZodDefault<z.ZodEnum<["pending", "completed", "failed"]>>;
    transactionId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "completed" | "failed";
    id: string;
    amount: number;
    orderId: string;
    method: "credit_card" | "paypal" | "bank_transfer";
    createdAt: Date;
    transactionId?: string | undefined;
    updatedAt?: Date | undefined;
}, {
    id: string;
    amount: number;
    orderId: string;
    method: "credit_card" | "paypal" | "bank_transfer";
    status?: "pending" | "completed" | "failed" | undefined;
    transactionId?: string | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
}>;
//# sourceMappingURL=Payment.d.ts.map