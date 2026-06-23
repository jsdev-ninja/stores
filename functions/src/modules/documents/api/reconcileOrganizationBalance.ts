import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";
import { z } from "zod";
import { reconcileOrganizationBalance } from "../services/reconcileOrganizationBalance";

const InputSchema = z
	.object({
		/**
		 * false = dry run (compute + report drift, write nothing).
		 * Defaults to true (apply: rebuild the rollup docs).
		 */
		apply: z.boolean().optional(),
	})
	.optional();

/**
 * Admin: rebuild organizationBalanceRollup docs for the caller's tenant from
 * the AR entry ledger. Serves as on-demand reconciliation and parity check.
 *
 * Auth: requires `admin` custom claim.
 * Tenant: companyId + storeId derived exclusively from auth token claims.
 */
export const reconcileOrganizationBalanceCallable = functionsV2.https.onCall(
	{ memory: "512MiB", invoker: "public" },
	async (request) => {
		const { auth, data } = request;

		if (!auth?.token.admin) {
			return { success: false as const, error: "Unauthorized" };
		}

		const companyId = auth.token.companyId as string | undefined;
		const storeId = auth.token.storeId as string | undefined;
		if (!companyId || !storeId) {
			logger.error("documents.reconcileOrganizationBalance.missingTokenClaims", {
				uid: auth.uid,
				hasCompanyId: !!companyId,
				hasStoreId: !!storeId,
			});
			return { success: false as const, error: "missing_token_claims" };
		}

		const parsed = InputSchema.safeParse(data);
		if (!parsed.success) {
			return { success: false as const, error: "invalid_input" };
		}

		const apply = parsed.data?.apply ?? true;

		try {
			const report = await reconcileOrganizationBalance({ companyId, storeId, apply });
			return { success: true as const, report };
		} catch (err: unknown) {
			logger.error("documents.reconcileOrganizationBalance.failed", {
				companyId,
				storeId,
				err: err instanceof Error ? err.message : String(err),
			});
			return { success: false as const, error: "internal" };
		}
	},
);
