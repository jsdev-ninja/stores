/**
 * saSearchOrders — find orders by exact id or by status filter, tenant-scoped.
 *
 * Input: SearchOrdersReq (companyId, storeId, byId? | byStatus?).
 * Returns: Result<OrderListRow[]>.
 */
import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";
import { verifySuperAdmin } from "../internal/verifySuperAdmin";
import { searchOrders } from "../internal/ordersStore";
import { SearchOrdersReqSchema } from "../contracts";
import type { Result, OrderListRow } from "../contracts";

export const saSearchOrders = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request): Promise<Result<OrderListRow[]>> => {
		const auth = verifySuperAdmin(request.auth);
		if (!auth.success) {
			return { success: false, error: auth.error };
		}

		const parsed = SearchOrdersReqSchema.safeParse(request.data);
		if (!parsed.success) {
			logger.warn("superAdmin.saSearchOrders: invalid input", {
				uid: auth.uid,
				issues: parsed.error.issues,
			});
			return { success: false, error: "invalid_input" };
		}

		try {
			const { rows, nextCursor } = await searchOrders(parsed.data);
			logger.info("superAdmin.saSearchOrders: ok", {
				uid: auth.uid,
				companyId: parsed.data.companyId,
				storeId: parsed.data.storeId,
				count: rows.length,
			});
			return { success: true, data: rows, nextCursor };
		} catch (err: unknown) {
			logger.error("superAdmin.saSearchOrders: internal error", {
				uid: auth.uid,
				companyId: parsed.data.companyId,
				storeId: parsed.data.storeId,
				err: err instanceof Error ? err.message : String(err),
			});
			return { success: false, error: "internal" };
		}
	},
);
