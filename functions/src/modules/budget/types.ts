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

export const BudgetIdempotencyMarkerSchema = z.object({
	/** The event id this marker corresponds to. Also the doc id. */
	eventId: z.string().min(1),
	/** epoch millis when the subscriber processed this event */
	processedAt: z.number(),
	/** epoch millis when this marker should auto-delete via Firestore TTL */
	expiresAt: z.number(),
});

export type TBudgetIdempotencyMarker = z.infer<typeof BudgetIdempotencyMarkerSchema>;
