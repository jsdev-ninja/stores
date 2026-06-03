import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { reconcileProjections } from "../services/reconcileProjections";

/**
 * Nightly reconciliation: rebuilds orgBalances + revenueRollups for every store
 * from its ledger. This is the self-healing guarantee — a missed or duplicated
 * event can never cause lasting wrong numbers, because the projections are
 * recomputed from the source-of-truth ledger every night.
 *
 * Runs best-effort per store: a failure on one store is logged and the run
 * continues with the rest.
 */
export const reconcileProjectionsSchedule = onSchedule(
	{
		schedule: "every day 03:15",
		timeZone: "Asia/Jerusalem",
		memory: "1GiB",
		timeoutSeconds: 540,
		retryCount: 0,
	},
	async () => {
		const db = admin.firestore();
		const storesSnap = await db.collection("STORES").get();

		let ok = 0;
		let failed = 0;
		let driftedTotal = 0;

		for (const storeDoc of storesSnap.docs) {
			const storeId = storeDoc.id;
			const companyId = (storeDoc.data()?.companyId as string | undefined) ?? undefined;
			if (!companyId) {
				logger.warn("budget.reconcileProjectionsSchedule: store missing companyId, skipping", {
					storeId,
				});
				continue;
			}

			try {
				const report = await reconcileProjections({
					companyId,
					storeId,
					apply: true,
				});
				ok++;
				driftedTotal += report.driftedOrgs;
				if (report.driftedOrgs > 0) {
					logger.warn("budget.reconcileProjectionsSchedule: drift corrected", {
						companyId,
						storeId,
						driftedOrgs: report.driftedOrgs,
						transactionsScanned: report.transactionsScanned,
					});
				}
			} catch (err: unknown) {
				failed++;
				logger.error("budget.reconcileProjectionsSchedule: store failed", {
					companyId,
					storeId,
					err: err instanceof Error ? err.message : String(err),
				});
			}
		}

		logger.info("budget.reconcileProjectionsSchedule: complete", {
			stores: storesSnap.size,
			ok,
			failed,
			driftedTotal,
		});
	},
);
