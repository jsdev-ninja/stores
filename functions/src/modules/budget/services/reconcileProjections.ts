import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { FirebaseAPI } from "@jsdev_ninja/core";
import { getJerusalemDateParts } from "../internal/dateParts";
import {
	revenueRollupPath,
} from "../internal/paths";
import {
	RevenueRollupSchema,
	TRevenueRollup,
} from "../types";

// ---------------------------------------------------------------------------
// reconcileProjections — rebuild revenueRollups from the cash ledger
// ---------------------------------------------------------------------------
//
// This is the STABILITY GUARANTEE of the revenue reporting and serves three jobs:
//   1. Backfill   — first run builds revenue projections from existing ledger.
//   2. Reconcile  — re-run anytime to self-heal drift (missed/duplicated event).
//   3. Parity     — `apply: false` returns computed numbers without writing, so
//                   they can be compared to the stored rollups.
//
// Revenue only: scans the `transactions` collection for cash rows (direction in/out).
// AR (orgBalances) has been moved to documents/services/reconcileOrganizationBalance.ts.
//
// Clamp note: revenue net = totalIn - totalOut (not clamped; can be negative if
// refunds exceed incoming in a given month).

type RevenueAgg = {
	totalIn: number;
	totalOut: number;
	byMethod: Record<string, number>;
	byOrg: Record<string, number>;
};

export type ReconcileMonthResult = {
	yearMonth: string;
	totalIn: number;
	totalOut: number;
	net: number;
};

export type ReconcileReport = {
	companyId: string;
	storeId: string;
	apply: boolean;
	transactionsScanned: number;
	months: ReconcileMonthResult[];
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
 * Recompute revenueRollups for one tenant from its cash ledger.
 * When `apply` is false this is a dry run — it computes + reports but
 * writes nothing (used for parity checks).
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

	const revenueAgg = new Map<string, RevenueAgg>();

	for (const doc of snap.docs) {
		const tx = doc.data() as {
			type: string;
			amount: number;
			direction: string;
			createdAt: number;
			payer?: { organizationId?: string };
		};
		const amount = tx.amount;
		if (typeof amount !== "number" || amount <= 0) continue;

		// Skip legacy AR rows (direction:"none") — they're now inert.
		const isCreditIn = tx.direction === "in";
		const isCreditOut = tx.direction === "out";
		if (!isCreditIn && !isCreditOut) continue;

		const orgId = tx.payer?.organizationId;

		// ── Revenue per month (cash only) ──
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

	const months: ReconcileMonthResult[] = [...revenueAgg.entries()].map(
		([yearMonth, agg]) => ({
			yearMonth,
			totalIn: agg.totalIn,
			totalOut: agg.totalOut,
			net: agg.totalIn - agg.totalOut,
		}),
	);

	// ── Apply (overwrite revenue rollup docs) ──
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

	logger.info("budget.reconcileProjections.done", {
		companyId,
		storeId,
		apply,
		transactionsScanned: snap.size,
		monthsComputed: months.length,
	});

	return {
		companyId,
		storeId,
		apply,
		transactionsScanned: snap.size,
		months,
	};
}
