import { z } from "zod";

export const LedgerEventTypes = {
	transactionPosted: "ledger.transaction_posted",
} as const;

// ---------------------------------------------------------------------------
// ledger.transaction_posted
// ---------------------------------------------------------------------------

export const TransactionPostedPayload = z.object({
	transactionId: z.string().min(1),
	/** credit = money in / owed-reduced; debit = owed-increased accrual. Defaults to credit for legacy events. */
	kind: z.enum(["credit", "debit"]).default("credit"),
	type: z.enum([
		"manual",
		"hyp_direct",
		"hyp_j5_auth",
		"hyp_capture",
		"delivery_note",
		"invoice",
		"credit_note",
		"adjustment",
	]),
	/** Integer agorot */
	amount: z.number().int().positive(),
	direction: z.enum(["in", "out", "none"]),
	reference: z
		.object({
			type: z.enum(["order", "refund", "adjustment"]),
			id: z.string().min(1),
		})
		.optional(),
	/**
	 * Payer identity forwarded from the Transaction doc so budget subscribers
	 * can identify which organization's debt to reduce without a second read.
	 */
	payer: z
		.object({
			organizationId: z.string().optional(),
			clientId: z.string().optional(),
			billingAccountId: z.string().optional(),
		})
		.optional(),
});

export type TransactionPostedPayload = z.infer<typeof TransactionPostedPayload>;

