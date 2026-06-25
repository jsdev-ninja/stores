/**
 * saSetProductStock — E3: set Product.stock.quantity, tenant-scoped.
 *
 * Input:  SetProductStockReq (companyId, storeId, id, quantity).
 * Returns: Result<WriteResult> — old/new value envelope or typed error.
 */
import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";
import { verifySuperAdmin } from "../internal/verifySuperAdmin";
import { setProductStock } from "../services/setProductStock";
import { SetProductStockReqSchema } from "../contracts";
import type { Result, WriteResult } from "../contracts";

export const saSetProductStock = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request): Promise<Result<WriteResult>> => {
		// Auth check FIRST — before any input parsing
		const auth = verifySuperAdmin(request.auth);
		if (!auth.success) {
			return { success: false, error: auth.error };
		}

		const parsed = SetProductStockReqSchema.safeParse(request.data);
		if (!parsed.success) {
			logger.warn("superAdmin.saSetProductStock: invalid input", {
				uid: auth.uid,
				issues: parsed.error.issues,
			});
			return { success: false, error: "invalid_input" };
		}

		const outcome = await setProductStock(parsed.data, auth.uid, auth.email);

		if ("error" in outcome) {
			if (outcome.error === "not_found") {
				return { success: false, error: "not_found" };
			}
			if (outcome.error === "stock_uninitialized") {
				return { success: false, error: "stock_uninitialized" };
			}
			logger.error("superAdmin.saSetProductStock: internal error", {
				uid: auth.uid,
				companyId: parsed.data.companyId,
				storeId: parsed.data.storeId,
				productId: parsed.data.id,
				error: outcome.error,
			});
			return { success: false, error: "internal" };
		}

		logger.info("superAdmin.saSetProductStock: ok", {
			uid: auth.uid,
			companyId: parsed.data.companyId,
			storeId: parsed.data.storeId,
			productId: parsed.data.id,
			quantity: parsed.data.quantity,
		});
		return { success: true, data: outcome.result };
	},
);
