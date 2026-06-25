/**
 * saSearchProducts — find products by sku (exact) or by name (prefix), tenant-scoped.
 *
 * Input: SearchProductsReq (companyId, storeId, bySku? | byName?).
 * Returns: Result<ProductListRow[]>.
 */
import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";
import { verifySuperAdmin } from "../internal/verifySuperAdmin";
import { searchProducts } from "../internal/productsStore";
import { SearchProductsReqSchema } from "../contracts";
import type { Result, ProductListRow } from "../contracts";

export const saSearchProducts = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request): Promise<Result<ProductListRow[]>> => {
		const auth = verifySuperAdmin(request.auth);
		if (!auth.success) {
			return { success: false, error: auth.error };
		}

		const parsed = SearchProductsReqSchema.safeParse(request.data);
		if (!parsed.success) {
			logger.warn("superAdmin.saSearchProducts: invalid input", {
				uid: auth.uid,
				issues: parsed.error.issues,
			});
			return { success: false, error: "invalid_input" };
		}

		try {
			const { rows, nextCursor } = await searchProducts(parsed.data);
			logger.info("superAdmin.saSearchProducts: ok", {
				uid: auth.uid,
				companyId: parsed.data.companyId,
				storeId: parsed.data.storeId,
				count: rows.length,
			});
			return { success: true, data: rows, nextCursor };
		} catch (err: unknown) {
			logger.error("superAdmin.saSearchProducts: internal error", {
				uid: auth.uid,
				companyId: parsed.data.companyId,
				storeId: parsed.data.storeId,
				err: err instanceof Error ? err.message : String(err),
			});
			return { success: false, error: "internal" };
		}
	},
);
