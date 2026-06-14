import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { reconcileOrganizationBalance } from "../services/reconcileOrganizationBalance";

/**
 * Nightly reconciliation: rebuilds organizationBalanceRollup docs for every
 * store from its AR entry ledger. This is the self-healing guarantee — a
 * missed or duplicated accrual/settlement event can never cause lasting wrong
 * numbers, because the rollups are recomputed from source-of-truth entries
 * every night.
 *
 * Revenue reconciliation runs separately via budget/reconcileProjectionsSchedule.ts.
 *
 * Runs best-effort per store: a failure on one store is logged and the run
 * continues with the rest.
 */
export const reconcileOrganizationBalanceSchedule = onSchedule(
	{
		schedule: "every day 04:00",
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
				logger.warn(
					"documents.reconcileOrganizationBalanceSchedule: store missing companyId, skipping",
					{ storeId },
				);
				continue;
			}

			try {
				const report = await reconcileOrganizationBalance({
					companyId,
					storeId,
					apply: true,
				});
				ok++;
				driftedTotal += report.driftedOrgs;
				if (report.driftedOrgs > 0) {
					logger.warn(
						"documents.reconcileOrganizationBalanceSchedule: drift corrected",
						{
							companyId,
							storeId,
							driftedOrgs: report.driftedOrgs,
							entriesScanned: report.entriesScanned,
						},
					);
				}
			} catch (err: unknown) {
				failed++;
				logger.error(
					"documents.reconcileOrganizationBalanceSchedule: store failed",
					{
						companyId,
						storeId,
						err: err instanceof Error ? err.message : String(err),
					},
				);
			}
		}

		logger.info("documents.reconcileOrganizationBalanceSchedule: complete", {
			stores: storesSnap.size,
			ok,
			failed,
			driftedTotal,
		});
	},
);
