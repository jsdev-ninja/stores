/**
 * saGetProfile — get a single profile by id, tenant-scoped.
 *
 * Input: GetReq (companyId, storeId, id).
 * Returns: Result<TProfile> — full doc for entity + raw-JSON views.
 */
import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";
import type { TProfile } from "@jsdev_ninja/core";
import { verifySuperAdmin } from "../internal/verifySuperAdmin";
import { getProfile } from "../internal/profilesStore";
import { GetReqSchema } from "../contracts";
import type { Result } from "../contracts";

export const saGetProfile = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request): Promise<Result<TProfile>> => {
		const auth = verifySuperAdmin(request.auth);
		if (!auth.success) {
			return { success: false, error: auth.error };
		}

		const parsed = GetReqSchema.safeParse(request.data);
		if (!parsed.success) {
			logger.warn("superAdmin.saGetProfile: invalid input", {
				uid: auth.uid,
				issues: parsed.error.issues,
			});
			return { success: false, error: "invalid_input" };
		}

		try {
			const profile = await getProfile(parsed.data);
			if (!profile) {
				return { success: false, error: "not_found" };
			}
			logger.info("superAdmin.saGetProfile: ok", {
				uid: auth.uid,
				companyId: parsed.data.companyId,
				storeId: parsed.data.storeId,
				profileId: parsed.data.id,
			});
			return { success: true, data: profile };
		} catch (err: unknown) {
			logger.error("superAdmin.saGetProfile: internal error", {
				uid: auth.uid,
				companyId: parsed.data.companyId,
				storeId: parsed.data.storeId,
				profileId: parsed.data.id,
				err: err instanceof Error ? err.message : String(err),
			});
			return { success: false, error: "internal" };
		}
	},
);
