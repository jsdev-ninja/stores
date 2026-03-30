import { z } from "zod";

export const BudgetTransactionTypeSchema = z.enum([
	"order_created",
	"payment_received",
	"order_cancelled",
	"order_refunded",
	"credit_note",
	"debit_note",
]);

export const PaymentMethodSchema = z.enum(["check", "bank_transfer", "cash", "credit_card", "other"]);

export const BudgetTransactionSchema = z.object({
	id: z.string(),
	type: BudgetTransactionTypeSchema,

	// positive = debt added (order/debit note), negative = debt reduced (payment/cancellation)
	debt: z.number(),
	runningBalance: z.number(),

	// order reference
	orderId: z.string().nullable(),
	orderTotal: z.number().nullable(),

	// billing account snapshot (if order had one)
	billingAccountId: z.string().nullable(),
	billingAccountName: z.string().nullable(),
	billingAccountNumber: z.string().nullable(),

	// payment details (for payment_received type — entered by admin)
	paymentReference: z.string().nullable(), // check number, bank transfer ref, etc.
	paymentDate: z.number().nullable(), // timestamp
	paymentMethod: PaymentMethodSchema.nullable(),

	note: z.string().nullable(),

	createdAt: z.number(),
	createdBy: z.string(), // userId or "system"
});

export const BudgetAccountSchema = z.object({
	id: z.string(), // organizationId
	organizationId: z.string(),
	organizationName: z.string(),
	companyId: z.string(),
	storeId: z.string(),

	totalDebits: z.number(), // sum of order amounts
	totalCredits: z.number(), // sum of payments received
	balance: z.number(), // totalDebits - totalCredits (positive = owes money)

	currency: z.literal("ILS"),
	updatedAt: z.number(),
});

export type TBudgetTransactionType = z.infer<typeof BudgetTransactionTypeSchema>;
export type TPaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type TBudgetTransaction = z.infer<typeof BudgetTransactionSchema>;
export type TBudgetAccount = z.infer<typeof BudgetAccountSchema>;
