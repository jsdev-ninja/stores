/**
 * saListProfiles — list profiles for a tenant, cursor-paginated.
 *
 * Input: ListReq (companyId, storeId, limit, cursor).
 * Returns: Result<ProfileListRow[]> with nextCursor.
 */
import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";
import { verifySuperAdmin } from "../internal/verifySuperAdmin";
import { listProfiles } from "../internal/profilesStore";
import { ListReqSchema } from "../contracts";
import type { Result, ProfileListRow } from "../contracts";

export const saListProfiles = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request): Promise<Result<ProfileListRow[]>> => {
		const auth = verifySuperAdmin(request.auth);
		if (!auth.success) {
			return { success: false, error: auth.error };
		}

		const parsed = ListReqSchema.safeParse(request.data);
		if (!parsed.success) {
			logger.warn("superAdmin.saListProfiles: invalid input", {
				uid: auth.uid,
				issues: parsed.error.issues,
			});
			return { success: false, error: "invalid_input" };
		}

		try {
			const { rows, nextCursor } = await listProfiles(parsed.data);
			logger.info("superAdmin.saListProfiles: ok", {
				uid: auth.uid,
				companyId: parsed.data.companyId,
				storeId: parsed.data.storeId,
				count: rows.length,
			});
			return { success: true, data: rows, nextCursor };
		} catch (err: unknown) {
			logger.error("superAdmin.saListProfiles: internal error", {
				uid: auth.uid,
				companyId: parsed.data.companyId,
				storeId: parsed.data.storeId,
				err: err instanceof Error ? err.message : String(err),
			});
			return { success: false, error: "internal" };
		}
	},
);
