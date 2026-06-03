import * as functions from "firebase-functions/v1";
import { logger } from "firebase-functions/v2";
import { z } from "zod";
import { reconcileProjections } from "../services/reconcileProjections";

const InputSchema = z
	.object({
		/**
		 * false = dry run (compute + report drift, write nothing) — used to
		 * compare the new projections against the legacy organizationBudgets
		 * before cutover. Defaults to true (apply: rebuild the docs).
		 */
		apply: z.boolean().optional(),
	})
	.optional();

/**
 * Admin: rebuild orgBalances + revenueRollups for the caller's tenant from the
 * ledger. Serves as backfill, on-demand reconciliation, and parity check.
 *
 * Auth: requires `admin` custom claim.
 * Tenant: companyId + storeId derived exclusively from auth token claims.
 */
export const reconcileBudgetProjections = functions.https.onCall(
	async (data: unknown, context) => {
		try {
			if (!context.auth?.token.admin) {
				return { success: false, error: "Unauthorized" };
			}

			const companyId = context.auth.token.companyId as string | undefined;
			const storeId = context.auth.token.storeId as string | undefined;
			if (!companyId || !storeId) {
				logger.error("budget.reconcileBudgetProjections.missingTokenClaims", {
					uid: context.auth.uid,
					hasCompanyId: !!companyId,
					hasStoreId: !!storeId,
				});
				return { success: false, error: "missing_token_claims" };
			}

			const parsed = InputSchema.safeParse(data);
			if (!parsed.success) {
				return { success: false, error: "invalid_input" };
			}
			const apply = parsed.data?.apply ?? true;

			const report = await reconcileProjections({ companyId, storeId, apply });

			return { success: true, report };
		} catch (err: unknown) {
			logger.error("budget.reconcileBudgetProjections.failed", {
				err: err instanceof Error ? err.message : String(err),
			});
			return { success: false, error: "internal" };
		}
	},
);
