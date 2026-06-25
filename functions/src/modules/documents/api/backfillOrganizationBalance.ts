import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";
import { z } from "zod";
import { backfillOrganizationBalance } from "../services/backfillOrganizationBalance";

const InputSchema = z
	.object({
		/**
		 * false (default) = dry run: count candidate accruals/settlements, write nothing.
		 * true = apply: replay historical delivery notes + payments into the AR ledger.
		 */
		apply: z.boolean().optional(),
	})
	.optional();

/**
 * Admin: one-time backfill of the organizationBalance (AR) entry ledger from
 * historical orders (delivery notes) + transactions (payments) for the caller's
 * tenant. Idempotent — reuses the same dedup keys as the live subscribers, so it
 * is safe to run repeatedly and safe to run alongside the live AR path.
 *
 * Recommended use:
 *   1. call with { apply: false } → review the candidate counts (dry run).
 *   2. call with { apply: true }  → write the entries.
 *   3. optionally call reconcileOrganizationBalance to confirm rollup parity.
 *
 * Auth: requires `admin` custom claim.
 * Tenant: companyId + storeId derived exclusively from auth token claims.
 */
export const backfillOrganizationBalanceCallable = functionsV2.https.onCall(
	{ memory: "512MiB", timeoutSeconds: 540, invoker: "public" },
	async (request) => {
		const { auth, data } = request;

		if (!auth?.token.admin) {
			return { success: false as const, error: "Unauthorized" };
		}

		const companyId = auth.token.companyId as string | undefined;
		const storeId = auth.token.storeId as string | undefined;
		if (!companyId || !storeId) {
			logger.error("documents.backfillOrganizationBalance.missingTokenClaims", {
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

		const apply = parsed.data?.apply ?? false;

		try {
			const report = await backfillOrganizationBalance({ companyId, storeId, apply });
			return { success: true as const, report };
		} catch (err: unknown) {
			logger.error("documents.backfillOrganizationBalance.failed", {
				companyId,
				storeId,
				err: err instanceof Error ? err.message : String(err),
			});
			return { success: false as const, error: "internal" };
		}
	},
);
