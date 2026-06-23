import admin from "firebase-admin";
import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";
import { z } from "zod";
import { TOrganizationBalanceEntry, TOrganizationBalanceRollup } from "@jsdev_ninja/core";
import {
	organizationBalanceRollupPath,
	organizationBalanceCollectionPath,
} from "../internal/paths";

const InputSchema = z.object({
	organizationId: z.string().min(1),
	/** Optional: filter entries to this date range (epoch millis) */
	fromMillis: z.number().int().positive().optional(),
	toMillis: z.number().int().positive().optional(),
});

/**
 * Admin: return the AR rollup + entry ledger for a single organization.
 *
 * Auth: requires `admin` custom claim.
 * Tenant: companyId + storeId from auth token — never from client input.
 */
export const getOrganizationBalance = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request) => {
		const { auth, data } = request;

		if (!auth?.token.admin) {
			return { success: false as const, error: "Unauthorized" };
		}

		const companyId = auth.token.companyId as string | undefined;
		const storeId = auth.token.storeId as string | undefined;
		if (!companyId || !storeId) {
			logger.error("documents.getOrganizationBalance.missingTokenClaims", {
				uid: auth.uid,
			});
			return { success: false as const, error: "missing_token_claims" };
		}

		const parsed = InputSchema.safeParse(data);
		if (!parsed.success) {
			return { success: false as const, error: "invalid_input" };
		}

		const { organizationId, fromMillis, toMillis } = parsed.data;
		const db = admin.firestore();

		// O(1) rollup read.
		const rollupSnap = await db
			.doc(organizationBalanceRollupPath(companyId, storeId, organizationId))
			.get();
		const rollup = rollupSnap.exists
			? (rollupSnap.data() as TOrganizationBalanceRollup)
			: null;

		// Entry ledger query (date-range optional; always tenant + org scoped).
		let query = db
			.collection(organizationBalanceCollectionPath(companyId, storeId))
			.where("organizationId", "==", organizationId)
			.orderBy("createdAt", "asc");

		if (fromMillis !== undefined) {
			query = query.where("createdAt", ">=", fromMillis);
		}
		if (toMillis !== undefined) {
			query = query.where("createdAt", "<=", toMillis);
		}

		const entriesSnap = await query.get();
		const entries: TOrganizationBalanceEntry[] = entriesSnap.docs.map(
			(d) => d.data() as TOrganizationBalanceEntry,
		);

		return {
			success: true as const,
			data: {
				rollup,
				entries,
			},
		};
	},
);
