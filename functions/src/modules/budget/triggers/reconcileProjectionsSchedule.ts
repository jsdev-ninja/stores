import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { reconcileProjections } from "../services/reconcileProjections";

/**
 * Nightly reconciliation: rebuilds revenueRollups for every store from its
 * cash ledger. This is the self-healing guarantee for revenue reporting — a
 * missed or duplicated event can never cause lasting wrong numbers.
 *
 * AR reconciliation (organizationBalance rollups) runs separately via
 * documents/triggers/reconcileOrganizationBalanceSchedule.ts.
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
				logger.info("budget.reconcileProjectionsSchedule: store done", {
					companyId,
					storeId,
					transactionsScanned: report.transactionsScanned,
					monthsComputed: report.months.length,
				});
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
		});
	},
);
