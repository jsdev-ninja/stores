import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { FirebaseAPI } from "@jsdev_ninja/core";
import { getJerusalemDateParts } from "../internal/dateParts";
import {
	orgBalancePath,
	revenueRollupPath,
} from "../internal/paths";
import {
	OrgBalanceSchema,
	RevenueRollupSchema,
	TOrgBalance,
	TRevenueRollup,
} from "../types";

// ---------------------------------------------------------------------------
// reconcileProjections — rebuild orgBalances + revenueRollups from the ledger
// ---------------------------------------------------------------------------
//
// This is the STABILITY GUARANTEE of the budget redesign and serves three jobs:
//   1. Backfill   — first run builds projections from existing ledger history.
//   2. Reconcile  — re-run anytime to self-heal drift (missed/duplicated event).
//   3. Parity     — `apply: false` returns computed numbers without writing, so
//                   they can be compared to the legacy organizationBudgets.
//
// The ledger is the single source of truth: every projection number here is a
// pure function of the tenant's `transactions` collection.
//
// Clamp note: owed is clamped ONCE at the end (max(0, ΣdebitsΣcredits-in)),
// which is order-independent — unlike the live per-event clamp. For normal
// credit-terms AR (debit on delivery note precedes the later payment) the two
// agree; reconcile is the authority and corrects any divergence.

type OrgAgg = { totalDebits: number; totalCredits: number };
type RevenueAgg = {
	totalIn: number;
	totalOut: number;
	byMethod: Record<string, number>;
	byOrg: Record<string, number>;
};

export type ReconcileOrgResult = {
	organizationId: string;
	owed: number;
	totalDebits: number;
	totalCredits: number;
	previousOwed: number | null;
	drift: number; // owed - previousOwed (0 = in sync)
};

export type ReconcileReport = {
	companyId: string;
	storeId: string;
	apply: boolean;
	transactionsScanned: number;
	orgs: ReconcileOrgResult[];
	months: Array<{ yearMonth: string; totalIn: number; totalOut: number; net: number }>;
	driftedOrgs: number;
};

const db = () => admin.firestore();

function transactionsPath(companyId: string, storeId: string): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "transactions",
	});
}

/**
 * Recompute orgBalances + revenueRollups for one tenant from its ledger.
 * When `apply` is false this is a dry run — it computes + reports drift but
 * writes nothing (used for parity checks before cutover).
 */
export async function reconcileProjections(params: {
	companyId: string;
	storeId: string;
	apply?: boolean;
}): Promise<ReconcileReport> {
	const { companyId, storeId } = params;
	const apply = params.apply ?? true;
	const now = Date.now();

	const snap = await db().collection(transactionsPath(companyId, storeId)).get();

	const orgAgg = new Map<string, OrgAgg>();
	const revenueAgg = new Map<string, RevenueAgg>();

	for (const doc of snap.docs) {
		const tx = doc.data() as {
			kind?: "credit" | "debit";
			type: string;
			amount: number;
			direction: "in" | "out" | "none";
			createdAt: number;
			payer?: { organizationId?: string };
		};
		const kind = tx.kind ?? "credit"; // legacy rows default to credit
		const orgId = tx.payer?.organizationId;
		const amount = tx.amount;
		if (typeof amount !== "number" || amount <= 0) continue;

		const isDebit = kind === "debit";
		const isCreditIn = kind === "credit" && tx.direction === "in";
		const isCreditOut = kind === "credit" && tx.direction === "out";

		// ── Accounts receivable per org ──
		if (orgId) {
			const agg = orgAgg.get(orgId) ?? { totalDebits: 0, totalCredits: 0 };
			if (isDebit) agg.totalDebits += amount;
			else if (isCreditIn) agg.totalCredits += amount;
			// credit/out (refund) leaves AR untouched (matches live).
			orgAgg.set(orgId, agg);
		}

		// ── Revenue per month (cash only) ──
		if (isCreditIn || isCreditOut) {
			const { yearMonth } = getJerusalemDateParts(tx.createdAt);
			const agg =
				revenueAgg.get(yearMonth) ??
				({ totalIn: 0, totalOut: 0, byMethod: {}, byOrg: {} } as RevenueAgg);
			if (isCreditIn) {
				agg.totalIn += amount;
				agg.byMethod[tx.type] = (agg.byMethod[tx.type] ?? 0) + amount;
				const key = orgId ?? "b2c";
				agg.byOrg[key] = (agg.byOrg[key] ?? 0) + amount;
			} else {
				agg.totalOut += amount;
			}
			revenueAgg.set(yearMonth, agg);
		}
	}

	// ── Build report (read existing docs to compute drift) ──
	const orgs: ReconcileOrgResult[] = [];
	for (const [organizationId, agg] of orgAgg) {
		const owed = Math.max(0, agg.totalDebits - agg.totalCredits);
		const existingSnap = await db()
			.doc(orgBalancePath(companyId, storeId, organizationId))
			.get();
		const previousOwed = existingSnap.exists
			? ((existingSnap.data() as TOrgBalance).owed ?? null)
			: null;
		orgs.push({
			organizationId,
			owed,
			totalDebits: agg.totalDebits,
			totalCredits: agg.totalCredits,
			previousOwed,
			drift: owed - (previousOwed ?? 0),
		});
	}

	const months = [...revenueAgg.entries()].map(([yearMonth, agg]) => ({
		yearMonth,
		totalIn: agg.totalIn,
		totalOut: agg.totalOut,
		net: agg.totalIn - agg.totalOut,
	}));

	// ── Apply (overwrite projection docs) ──
	if (apply) {
		let batch = db().batch();
		let ops = 0;
		const flush = async () => {
			if (ops > 0) {
				await batch.commit();
				batch = db().batch();
				ops = 0;
			}
		};

		for (const [organizationId, agg] of orgAgg) {
			const owed = Math.max(0, agg.totalDebits - agg.totalCredits);
			const next: TOrgBalance = OrgBalanceSchema.parse({
				organizationId,
				owed,
				totalDebits: agg.totalDebits,
				totalCredits: agg.totalCredits,
				currency: "ILS",
				updatedAt: now,
				companyId,
				storeId,
			});
			batch.set(db().doc(orgBalancePath(companyId, storeId, organizationId)), next);
			if (++ops >= 400) await flush();
		}

		for (const [yearMonth, agg] of revenueAgg) {
			const next: TRevenueRollup = RevenueRollupSchema.parse({
				yearMonth,
				totalIn: agg.totalIn,
				totalOut: agg.totalOut,
				net: agg.totalIn - agg.totalOut,
				byMethod: agg.byMethod,
				byOrg: agg.byOrg,
				currency: "ILS",
				updatedAt: now,
				companyId,
				storeId,
			});
			batch.set(db().doc(revenueRollupPath(companyId, storeId, yearMonth)), next);
			if (++ops >= 400) await flush();
		}

		await flush();
	}

	const driftedOrgs = orgs.filter((o) => o.drift !== 0).length;

	logger.info("budget.reconcileProjections.done", {
		companyId,
		storeId,
		apply,
		transactionsScanned: snap.size,
		orgsComputed: orgs.length,
		monthsComputed: months.length,
		driftedOrgs,
	});

	return {
		companyId,
		storeId,
		apply,
		transactionsScanned: snap.size,
		orgs,
		months,
		driftedOrgs,
	};
}
