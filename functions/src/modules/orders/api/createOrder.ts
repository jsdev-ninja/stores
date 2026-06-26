import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";
import { orderService } from "../services/orderService";
import { TOrder } from "@jsdev_ninja/core";

/**
 * Callable: create a new order.
 *
 * Auth requirements:
 *   - Must be authenticated.
 */
export const createOrder = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request) => {
		const { auth, data } = request;

		if (!auth) {
			logger.warn("api.createOrder: unauthorized", { uid: null });
			return { success: false as const, error: "Unauthorized" };
		}

		const companyId = data.companyId || (auth.token.companyId as string);
		const storeId = data.storeId || (auth.token.storeId as string);

		if (!companyId || !storeId) {
			return { success: false as const, error: "Missing companyId or storeId" };
		}

		if (!data.order) {
			return { success: false as const, error: "Missing order data" };
		}

		await orderService.create({
			order: data.order as TOrder,
			companyId,
			storeId,
			actorId: auth.uid,
		});

		return { success: true as const, data: { id: data.order.id } };
	},
);
