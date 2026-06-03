import { z } from "zod";

// ---------------------------------------------------------------------------
// New flat collections (target model — B0)
// ---------------------------------------------------------------------------

export const BudgetRecordTypeSchema = z.enum(["debt_increase", "debt_reduction"]);
export type TBudgetRecordType = z.infer<typeof BudgetRecordTypeSchema>;

export const BudgetRecordSchema = z.object({
	recordId: z.string().min(1),
	organizationId: z.string().min(1),
	customerId: z.string(), // "system" when no acting user
	customerName: z.string(),
	billingAccountId: z.string().nullable(),
	type: BudgetRecordTypeSchema,
	/** Integer agorot, always positive */
	amount: z.number().int().positive(),
	currency: z.literal("ILS"),
	/** orderId (debt_increase) | ledger transactionId (debt_reduction) */
	relatedId: z.string().min(1),
	source: z.enum(["order", "ledger", "manual"]),
	/** event that caused this — trace + idempotency key; null for manual */
	causedByEventId: z.string().nullable(),
	/** epoch millis */
	createdAt: z.number().int().positive(),
	/** Asia/Jerusalem date parts */
	year: z.number().int(),
	month: z.number().int().min(1).max(12),
	/** "2026-05" */
	yearMonth: z.string(),
	companyId: z.string().min(1),
	storeId: z.string().min(1),
});
export type TBudgetRecord = z.infer<typeof BudgetRecordSchema>;

export const OrganizationBudgetSchema = z.object({
	/** = doc id */
	organizationId: z.string().min(1),
	organizationName: z.string(),
	/** integer agorot — current outstanding debt */
	totalCurrentDebt: z.number().int(),
	/** lifetime sums (agorot) */
	totalDebits: z.number().int(),
	totalCredits: z.number().int(),
	currency: z.literal("ILS"),
	/** epoch millis */
	updatedAt: z.number().int().positive(),
	companyId: z.string().min(1),
	storeId: z.string().min(1),
});
export type TOrganizationBudget = z.infer<typeof OrganizationBudgetSchema>;

// ---------------------------------------------------------------------------
// Legacy collections (kept for backward compatibility — data left inert)
// ---------------------------------------------------------------------------

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

export type TBudgetTransactionType = z.infer<typeof BudgetTransactionTypeSchema>;
export type TPaymentMethod = z.infer<typeof PaymentMethodSchema>;
