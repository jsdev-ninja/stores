/**
 * saGetProduct — get a single product by id, tenant-scoped.
 *
 * Input: GetReq (companyId, storeId, id).
 * Returns: Result<TProduct> — full doc for entity + raw-JSON views.
 */
import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";
import type { TProduct } from "@jsdev_ninja/core";
import { verifySuperAdmin } from "../internal/verifySuperAdmin";
import { getProduct } from "../internal/productsStore";
import { GetReqSchema } from "../contracts";
import type { Result } from "../contracts";

export const saGetProduct = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request): Promise<Result<TProduct>> => {
		const auth = verifySuperAdmin(request.auth);
		if (!auth.success) {
			return { success: false, error: auth.error };
		}

		const parsed = GetReqSchema.safeParse(request.data);
		if (!parsed.success) {
			logger.warn("superAdmin.saGetProduct: invalid input", {
				uid: auth.uid,
				issues: parsed.error.issues,
			});
			return { success: false, error: "invalid_input" };
		}

		try {
			const product = await getProduct(parsed.data);
			if (!product) {
				return { success: false, error: "not_found" };
			}
			logger.info("superAdmin.saGetProduct: ok", {
				uid: auth.uid,
				companyId: parsed.data.companyId,
				storeId: parsed.data.storeId,
				productId: parsed.data.id,
			});
			return { success: true, data: product };
		} catch (err: unknown) {
			logger.error("superAdmin.saGetProduct: internal error", {
				uid: auth.uid,
				companyId: parsed.data.companyId,
				storeId: parsed.data.storeId,
				productId: parsed.data.id,
				err: err instanceof Error ? err.message : String(err),
			});
			return { success: false, error: "internal" };
		}
	},
);
