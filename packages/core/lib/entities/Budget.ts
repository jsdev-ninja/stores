import { z } from "zod";

export const BudgetTransactionTypeSchema = z.enum([
	"delivery_note",
	"payment_received",
	"credit_note",
	"debit_note",
	"order_created",   // legacy — no longer used for new transactions
	"order_cancelled", // legacy
	"order_refunded",  // legacy
]);

export const PaymentMethodSchema = z.enum(["check", "bank_transfer", "cash", "credit_card", "other"]);

export const BudgetTransactionSchema = z.object({
	id: z.string(),
	type: BudgetTransactionTypeSchema,

	// positive = debt added (delivery note / debit note), negative = debt reduced (payment / credit)
	debt: z.number(),
	runningBalance: z.number(),

	// order reference
	orderId: z.string().nullable(),
	orderTotal: z.number().nullable(),

	// delivery note reference (for delivery_note type)
	deliveryNoteId: z.string().nullable(),
	deliveryNoteNumber: z.string().nullable(),

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

	totalDebits: z.number(), // sum of delivery note amounts
	totalCredits: z.number(), // sum of payments received
	balance: z.number(), // totalDebits - totalCredits (positive = owes money)

	currency: z.literal("ILS"),
	updatedAt: z.number(),
});

export type TBudgetTransactionType = z.infer<typeof BudgetTransactionTypeSchema>;
export type TPaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type TBudgetTransaction = z.infer<typeof BudgetTransactionSchema>;
export type TBudgetAccount = z.infer<typeof BudgetAccountSchema>;
