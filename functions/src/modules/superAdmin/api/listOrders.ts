/**
 * saListOrders — list orders for a tenant, newest first, cursor-paginated.
 *
 * Input: ListReq (companyId, storeId, limit, cursor).
 * Returns: Result<OrderListRow[]> with nextCursor.
 */
import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";
import { verifySuperAdmin } from "../internal/verifySuperAdmin";
import { listOrders } from "../internal/ordersStore";
import { ListReqSchema } from "../contracts";
import type { Result, OrderListRow } from "../contracts";

export const saListOrders = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request): Promise<Result<OrderListRow[]>> => {
		const auth = verifySuperAdmin(request.auth);
		if (!auth.success) {
			return { success: false, error: auth.error };
		}

		const parsed = ListReqSchema.safeParse(request.data);
		if (!parsed.success) {
			logger.warn("superAdmin.saListOrders: invalid input", {
				uid: auth.uid,
				issues: parsed.error.issues,
			});
			return { success: false, error: "invalid_input" };
		}

		try {
			const { rows, nextCursor } = await listOrders(parsed.data);
			logger.info("superAdmin.saListOrders: ok", {
				uid: auth.uid,
				companyId: parsed.data.companyId,
				storeId: parsed.data.storeId,
				count: rows.length,
			});
			return { success: true, data: rows, nextCursor };
		} catch (err: unknown) {
			logger.error("superAdmin.saListOrders: internal error", {
				uid: auth.uid,
				companyId: parsed.data.companyId,
				storeId: parsed.data.storeId,
				err: err instanceof Error ? err.message : String(err),
			});
			return { success: false, error: "internal" };
		}
	},
);
