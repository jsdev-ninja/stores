import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import {
	OrganizationBalanceRollupSchema,
	TOrganizationBalanceEntry,
	TOrganizationBalanceRollup,
} from "@jsdev_ninja/core";
import {
	organizationBalanceCollectionPath,
	organizationBalanceRollupPath,
	organizationBalanceRollupCollectionPath,
} from "../internal/paths";

// ---------------------------------------------------------------------------
// reconcileOrganizationBalance — rebuild rollups from the AR entry ledger
// ---------------------------------------------------------------------------
//
// This is the STABILITY GUARANTEE of the AR system:
//   1. Reconcile — re-run anytime to self-heal drift from missed/replayed events.
//   2. Parity    — `apply: false` (dry run): computes + reports drift, writes nothing.
//
// The entry ledger (organizationBalance) is the SOURCE OF TRUTH.
// The rollup (organizationBalanceRollup) is a CACHE — always rebuildable here.
//
// Important: this service scans the organizationBalance ENTRY ledger, never the
// transactions collection. The two reconcile passes are independent:
//   - AR: this service (documents module)
//   - Revenue: budget/services/reconcileProjections.ts (scans transactions)

type OrgAgg = {
	totalAccrued: number;   // Σ(sign:"+")
	totalSettled: number;   // Σ(sign:"-")
};

export type ReconcileOrgResult = {
	organizationId: string;
	owed: number;
	/** Overpayment: max(0, totalSettled - totalAccrued). At most one of {owed, credit} is non-zero. */
	credit: number;
	totalAccrued: number;
	totalSettled: number;
	previousOwed: number | null;
	drift: number; // owed - previousOwed (0 = in sync)
};

export type ReconcileOrganizationBalanceReport = {
	companyId: string;
	storeId: string;
	apply: boolean;
	entriesScanned: number;
	orgs: ReconcileOrgResult[];
	driftedOrgs: number;
};

const db = () => admin.firestore();

/**
 * Recompute organizationBalanceRollup docs for one tenant from its AR entry ledger.
 * When `apply` is false this is a dry run — computes + reports drift, writes nothing.
 */
export async function reconcileOrganizationBalance(params: {
	companyId: string;
	storeId: string;
	apply?: boolean;
}): Promise<ReconcileOrganizationBalanceReport> {
	const { companyId, storeId } = params;
	const apply = params.apply ?? true;
	const now = Date.now();

	// Scan the full AR entry ledger for this tenant.
	const entriesSnap = await db()
		.collection(organizationBalanceCollectionPath(companyId, storeId))
		.get();

	const orgAgg = new Map<string, OrgAgg>();

	for (const doc of entriesSnap.docs) {
		const entry = doc.data() as TOrganizationBalanceEntry;

		const orgId = entry.organizationId;
		if (!orgId) continue;

		const amount = entry.amount;
		if (typeof amount !== "number" || amount <= 0) continue;

		const agg = orgAgg.get(orgId) ?? { totalAccrued: 0, totalSettled: 0 };

		if (entry.sign === "+") {
			agg.totalAccrued += amount;
		} else if (entry.sign === "-") {
			agg.totalSettled += amount;
		}

		orgAgg.set(orgId, agg);
	}

	// ── Build report (read existing rollup docs to compute drift) ──
	const orgs: ReconcileOrgResult[] = [];
	for (const [organizationId, agg] of orgAgg) {
		// Both formulas are identical to the incremental writer in organizationBalanceStore.ts.
		const owed = Math.max(0, agg.totalAccrued - agg.totalSettled);
		const credit = Math.max(0, agg.totalSettled - agg.totalAccrued);
		const existingSnap = await db()
			.doc(organizationBalanceRollupPath(companyId, storeId, organizationId))
			.get();
		const previousOwed = existingSnap.exists
			? ((existingSnap.data() as TOrganizationBalanceRollup).owed ?? null)
			: null;

		orgs.push({
			organizationId,
			owed,
			credit,
			totalAccrued: agg.totalAccrued,
			totalSettled: agg.totalSettled,
			previousOwed,
			drift: owed - (previousOwed ?? 0),
		});
	}

	// ── Apply (overwrite rollup docs) ──
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
			const owed = Math.max(0, agg.totalAccrued - agg.totalSettled);
			const credit = Math.max(0, agg.totalSettled - agg.totalAccrued);
			const next: TOrganizationBalanceRollup = OrganizationBalanceRollupSchema.parse({
				organizationId,
				owed,
				credit,
				totalAccrued: agg.totalAccrued,
				totalSettled: agg.totalSettled,
				currency: "ILS",
				updatedAt: now,
				companyId,
				storeId,
			});
			batch.set(
				db().doc(organizationBalanceRollupPath(companyId, storeId, organizationId)),
				next,
			);
			if (++ops >= 400) await flush();
		}

		// Zero out orgs that no longer have entries (orphaned rollup docs).
		// Only do this if we've scanned at least one entry — empty ledger means
		// we can't tell stale rollup from never-written.
		if (entriesSnap.size > 0) {
			const rollupSnap = await db()
				.collection(organizationBalanceRollupCollectionPath(companyId, storeId))
				.get();
			for (const rollupDoc of rollupSnap.docs) {
				if (!orgAgg.has(rollupDoc.id)) {
					// Org has a rollup but no entries — zero it out.
					const zeroed: TOrganizationBalanceRollup = OrganizationBalanceRollupSchema.parse({
						organizationId: rollupDoc.id,
						owed: 0,
						credit: 0,
						totalAccrued: 0,
						totalSettled: 0,
						currency: "ILS",
						updatedAt: now,
						companyId,
						storeId,
					});
					batch.set(rollupDoc.ref, zeroed);
					if (++ops >= 400) await flush();
				}
			}
		}

		await flush();
	}

	const driftedOrgs = orgs.filter((o) => o.drift !== 0).length;

	logger.info("documents.reconcileOrganizationBalance.done", {
		companyId,
		storeId,
		apply,
		entriesScanned: entriesSnap.size,
		orgsComputed: orgs.length,
		driftedOrgs,
	});

	return {
		companyId,
		storeId,
		apply,
		entriesScanned: entriesSnap.size,
		orgs,
		driftedOrgs,
	};
}
