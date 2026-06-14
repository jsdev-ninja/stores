import { z } from "zod";

export const LedgerEventTypes = {
	transactionPosted: "ledger.transaction_posted",
} as const;

// ---------------------------------------------------------------------------
// ledger.transaction_posted
// Emitted for every posted cash transaction (in or out).
// AR accruals are no longer posted through this event.
// ---------------------------------------------------------------------------

export const TransactionPostedPayload = z.object({
	transactionId: z.string().min(1),
	/** Narrows to the four real-money types. */
	type: z.enum(["manual", "hyp_direct", "hyp_j5_auth", "hyp_capture"]),
	/** Integer agorot */
	amount: z.number().int().positive(),
	/** in = money received, out = refund. */
	direction: z.enum(["in", "out"]),
	reference: z
		.object({
			type: z.enum(["order", "refund", "adjustment"]),
			id: z.string().min(1),
		})
		.optional(),
	/**
	 * Payer identity forwarded so settlement subscribers (documents module)
	 * can identify which organization's AR to reduce without a second read.
	 * Still present here; the documents settlement subscriber uses payer.organizationId
	 * as a routing hint and re-reads the stored tx for authoritative values.
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

