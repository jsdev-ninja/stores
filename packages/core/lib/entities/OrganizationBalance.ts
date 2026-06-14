import { z } from "zod";

// ---------------------------------------------------------------------------
// Append-only AR entry ledger document
// ---------------------------------------------------------------------------

export const OrganizationBalanceEntrySchema = z.object({
	/** = deterministic dedup doc id */
	id: z.string().min(1),
	organizationId: z.string().min(1),
	/** "+" increases owed (accrual), "-" decreases owed (settlement/adjustment) */
	sign: z.enum(["+", "-"]),
	kind: z.enum(["accrual", "settlement", "adjustment"]),
	/** Integer agorot, always positive; sign carries direction */
	amount: z.number().int().positive(),
	currency: z.literal("ILS"),
	source: z.enum(["delivery_note", "ledger_payment", "manual", "order_reversal"]),
	/** Present for document-sourced accruals */
	document: z
		.object({
			type: z.enum(["delivery_note", "invoice"]),
			id: z.string().min(1),
			number: z.string().optional(),
		})
		.optional(),
	/** Order id (accrual), ledger txId (settlement), or manual ref */
	reference: z
		.object({
			type: z.enum(["order", "transaction", "manual"]),
			id: z.string().min(1),
		})
		.optional(),
	/** Optional sub-grouping within an org */
	billingAccountId: z.string().nullable().optional(),
	/** Deterministic dedup key; doc id is derived from this */
	dedupKey: z.string().min(1),
	/** Event id when source is event-driven */
	causedByEventId: z.string().optional(),
	/** Epoch millis — used for date-range queries */
	createdAt: z.number().int().positive(),
	companyId: z.string().min(1),
	storeId: z.string().min(1),
});

export type TOrganizationBalanceEntry = z.infer<typeof OrganizationBalanceEntrySchema>;

// ---------------------------------------------------------------------------
// Per-org rollup cache (O(1) balance reads)
// ---------------------------------------------------------------------------

export const OrganizationBalanceRollupSchema = z.object({
	/** = doc id */
	organizationId: z.string().min(1),
	/** Σ(+) − Σ(−), clamped ≥ 0; integer agorot. Non-zero only when totalAccrued > totalSettled. */
	owed: z.number().int(),
	/**
	 * Overpayment credit: max(0, totalSettled − totalAccrued); integer agorot, ≥ 0.
	 * Non-zero only when org has paid MORE than it has accrued.
	 * Visibility only — not client-spendable. At most one of {owed, credit} is non-zero.
	 */
	credit: z.number().int(),
	/** Lifetime Σ(+); integer agorot */
	totalAccrued: z.number().int(),
	/** Lifetime Σ(−); integer agorot */
	totalSettled: z.number().int(),
	currency: z.literal("ILS"),
	/** Epoch millis */
	updatedAt: z.number().int().positive(),
	companyId: z.string().min(1),
	storeId: z.string().min(1),
});

export type TOrganizationBalanceRollup = z.infer<typeof OrganizationBalanceRollupSchema>;
