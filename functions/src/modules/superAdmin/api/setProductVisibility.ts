/**
 * saSetProductVisibility — E2: toggle Product.isPublished, tenant-scoped.
 *
 * Input:  SetProductVisibilityReq (companyId, storeId, id, isPublished).
 * Returns: Result<WriteResult> — old/new value envelope or typed error.
 */
import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";
import { verifySuperAdmin } from "../internal/verifySuperAdmin";
import { setProductVisibility } from "../services/setProductVisibility";
import { SetProductVisibilityReqSchema } from "../contracts";
import type { Result, WriteResult } from "../contracts";

export const saSetProductVisibility = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request): Promise<Result<WriteResult>> => {
		// Auth check FIRST — before any input parsing
		const auth = verifySuperAdmin(request.auth);
		if (!auth.success) {
			return { success: false, error: auth.error };
		}

		const parsed = SetProductVisibilityReqSchema.safeParse(request.data);
		if (!parsed.success) {
			logger.warn("superAdmin.saSetProductVisibility: invalid input", {
				uid: auth.uid,
				issues: parsed.error.issues,
			});
			return { success: false, error: "invalid_input" };
		}

		const outcome = await setProductVisibility(parsed.data, auth.uid, auth.email);

		if ("error" in outcome) {
			if (outcome.error === "not_found") {
				return { success: false, error: "not_found" };
			}
			logger.error("superAdmin.saSetProductVisibility: internal error", {
				uid: auth.uid,
				companyId: parsed.data.companyId,
				storeId: parsed.data.storeId,
				productId: parsed.data.id,
				error: outcome.error,
			});
			return { success: false, error: "internal" };
		}

		logger.info("superAdmin.saSetProductVisibility: ok", {
			uid: auth.uid,
			companyId: parsed.data.companyId,
			storeId: parsed.data.storeId,
			productId: parsed.data.id,
			isPublished: parsed.data.isPublished,
		});
		return { success: true, data: outcome.result };
	},
);
