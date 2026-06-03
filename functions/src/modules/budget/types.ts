import { z } from "zod";

export {
	BudgetTransactionSchema,
	BudgetAccountSchema,
	BudgetTransactionTypeSchema,
	PaymentMethodSchema,
} from "@jsdev_ninja/core";

export type {
	TBudgetTransaction,
	TBudgetAccount,
	TBudgetTransactionType,
	TPaymentMethod,
} from "@jsdev_ninja/core";

// Rollup doc — pre-aggregated budget totals by time bucket and (optionally) by org/billing-account.
// Doc ID rule: `{granularity}_{period}[_org-{X}][_ba-{Y}]`. Only filled dims appear in the ID.
// Canonical suffix order: org → ba. Adding new dims later extends the order; existing IDs stay stable.
// Examples:
//   month_2026-05                              → whole store, May 2026
//   month_2026-05_org-acme-corp                → acme-corp, May 2026
//   month_2026-05_org-acme-corp_ba-hq          → acme-corp's "HQ" billing account, May 2026
//   lifetime                                   → whole store, lifetime
//   lifetime_org-acme-corp                     → acme-corp, lifetime
export const BudgetRollupSchema = z.object({
	id: z.string(),
	granularity: z.enum(["day", "week", "month", "quarter", "year", "lifetime"]),
	/** "2026-05-29" | "2026-W22" | "2026-05" | "2026-Q2" | "2026" | "lifetime" */
	period: z.string(),

	/** null = aggregated across all orgs (incl. B2C transactions). */
	organizationId: z.string().nullable(),
	/**
	 * Internal sub-grouping within an org (e.g. HQ, Branch-North) used on delivery notes / invoices.
	 * null = aggregated across all of the org's billing accounts.
	 */
	billingAccountId: z.string().nullable(),

	companyId: z.string(),
	storeId: z.string(),

	balance: z.number(),
	totalDebits: z.number(),
	totalCredits: z.number(),
	currency: z.literal("ILS"),
	/** epoch millis */
	updatedAt: z.number(),
});

export type TBudgetRollup = z.infer<typeof BudgetRollupSchema>;

// ---------------------------------------------------------------------------
// Budget redesign — ledger-derived projection read-models (Phase 1)
// These are CACHES rebuildable from the ledger; never the source of truth.
// Written only by applyLedgerProjection, alongside the legacy model (dual-write).
// ---------------------------------------------------------------------------

/**
 * Accounts-receivable balance per organization.
 * owed = Σ(debits) − Σ(credits, money in), clamped ≥ 0.
 */
export const OrgBalanceSchema = z.object({
	organizationId: z.string().min(1),
	/** Integer agorot, clamped ≥ 0 */
	owed: z.number().int(),
	/** Integer agorot, lifetime sum of debit accruals */
	totalDebits: z.number().int(),
	/** Integer agorot, lifetime sum of credit (money-in) applied to this org */
	totalCredits: z.number().int(),
	currency: z.literal("ILS"),
	/** epoch millis */
	updatedAt: z.number().int().positive(),
	companyId: z.string().min(1),
	storeId: z.string().min(1),
});

export type TOrgBalance = z.infer<typeof OrgBalanceSchema>;

/**
 * Revenue rollup per calendar month (Asia/Jerusalem). Doc id = yearMonth.
 * Answers: total earned, per month/year, J5-vs-external split, per-org revenue.
 */
export const RevenueRollupSchema = z.object({
	/** "2026-06" (Asia/Jerusalem), also the doc id */
	yearMonth: z.string().regex(/^\d{4}-\d{2}$/),
	/** Integer agorot, money received this month */
	totalIn: z.number().int(),
	/** Integer agorot, refunds out this month */
	totalOut: z.number().int(),
	/** totalIn − totalOut */
	net: z.number().int(),
	/** Integer agorot per payment instrument: manual / hyp_capture / hyp_direct / hyp_j5_auth */
	byMethod: z.record(z.number().int()),
	/** Integer agorot per organizationId ("b2c" bucket for orderless/no-org) */
	byOrg: z.record(z.number().int()),
	currency: z.literal("ILS"),
	/** epoch millis */
	updatedAt: z.number().int().positive(),
	companyId: z.string().min(1),
	storeId: z.string().min(1),
});

export type TRevenueRollup = z.infer<typeof RevenueRollupSchema>;

export const BudgetIdempotencyMarkerSchema = z.object({
	/** The event id this marker corresponds to. Also the doc id. */
	eventId: z.string().min(1),
	/** epoch millis when the subscriber processed this event */
	processedAt: z.number(),
	/** epoch millis when this marker should auto-delete via Firestore TTL */
	expiresAt: z.number(),
});

export type TBudgetIdempotencyMarker = z.infer<typeof BudgetIdempotencyMarkerSchema>;
