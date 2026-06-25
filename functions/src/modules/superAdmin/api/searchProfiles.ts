/**
 * saSearchProfiles — find profiles by exact email or exact phoneNumber, tenant-scoped.
 *
 * Input: SearchProfilesReq (companyId, storeId, byEmail? | byPhone?).
 * Returns: Result<ProfileListRow[]>.
 */
import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";
import { verifySuperAdmin } from "../internal/verifySuperAdmin";
import { searchProfiles } from "../internal/profilesStore";
import { SearchProfilesReqSchema } from "../contracts";
import type { Result, ProfileListRow } from "../contracts";

export const saSearchProfiles = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request): Promise<Result<ProfileListRow[]>> => {
		const auth = verifySuperAdmin(request.auth);
		if (!auth.success) {
			return { success: false, error: auth.error };
		}

		const parsed = SearchProfilesReqSchema.safeParse(request.data);
		if (!parsed.success) {
			logger.warn("superAdmin.saSearchProfiles: invalid input", {
				uid: auth.uid,
				issues: parsed.error.issues,
			});
			return { success: false, error: "invalid_input" };
		}

		try {
			const { rows, nextCursor } = await searchProfiles(parsed.data);
			logger.info("superAdmin.saSearchProfiles: ok", {
				uid: auth.uid,
				companyId: parsed.data.companyId,
				storeId: parsed.data.storeId,
				count: rows.length,
			});
			return { success: true, data: rows, nextCursor };
		} catch (err: unknown) {
			logger.error("superAdmin.saSearchProfiles: internal error", {
				uid: auth.uid,
				companyId: parsed.data.companyId,
				storeId: parsed.data.storeId,
				err: err instanceof Error ? err.message : String(err),
			});
			return { success: false, error: "internal" };
		}
	},
);
