import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";
import { orderService } from "../services/orderService";
import { TOrder } from "@jsdev_ninja/core";

/**
 * Callable: update an existing order.
 *
 * Auth requirements:
 *   - Must be authenticated.
 */
export const updateOrder = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request) => {
		const { auth, data } = request;

		if (!auth) {
			logger.warn("api.updateOrder: unauthorized", { uid: null });
			return { success: false as const, error: "Unauthorized" };
		}

		const companyId = data.companyId || (auth.token.companyId as string);
		const storeId = data.storeId || (auth.token.storeId as string);

		if (!companyId || !storeId) {
			return { success: false as const, error: "Missing companyId or storeId" };
		}

		if (!data.orderId || !data.updates) {
			return { success: false as const, error: "Missing orderId or updates data" };
		}

		await orderService.update({
			orderId: data.orderId,
			updates: data.updates as Partial<TOrder>,
			companyId,
			storeId,
			actorId: auth.uid,
		});

		return { success: true as const, data: { id: data.orderId } };
	},
);
