/**
 * saGetOrder — get a single order by id, tenant-scoped.
 *
 * Input: GetReq (companyId, storeId, id).
 * Returns: Result<TOrder> — full doc for entity + raw-JSON views.
 */
import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";
import type { TOrder } from "@jsdev_ninja/core";
import { verifySuperAdmin } from "../internal/verifySuperAdmin";
import { getOrder } from "../internal/ordersStore";
import { GetReqSchema } from "../contracts";
import type { Result } from "../contracts";

export const saGetOrder = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request): Promise<Result<TOrder>> => {
		const auth = verifySuperAdmin(request.auth);
		if (!auth.success) {
			return { success: false, error: auth.error };
		}

		const parsed = GetReqSchema.safeParse(request.data);
		if (!parsed.success) {
			logger.warn("superAdmin.saGetOrder: invalid input", {
				uid: auth.uid,
				issues: parsed.error.issues,
			});
			return { success: false, error: "invalid_input" };
		}

		try {
			const order = await getOrder(parsed.data);
			if (!order) {
				return { success: false, error: "not_found" };
			}
			logger.info("superAdmin.saGetOrder: ok", {
				uid: auth.uid,
				companyId: parsed.data.companyId,
				storeId: parsed.data.storeId,
				orderId: parsed.data.id,
			});
			return { success: true, data: order };
		} catch (err: unknown) {
			logger.error("superAdmin.saGetOrder: internal error", {
				uid: auth.uid,
				companyId: parsed.data.companyId,
				storeId: parsed.data.storeId,
				orderId: parsed.data.id,
				err: err instanceof Error ? err.message : String(err),
			});
			return { success: false, error: "internal" };
		}
	},
);
