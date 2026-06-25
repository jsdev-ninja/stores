/**
 * saListStores — list all stores from the root STORES collection.
 *
 * No input (empty object). Returns StoreListItem[] wrapped in Result<T>.
 * Root-collection read is the documented exception for store enumeration.
 */
import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";
import { verifySuperAdmin } from "../internal/verifySuperAdmin";
import { listAllStores } from "../internal/storesStore";
import type { Result, StoreListItem } from "../contracts";

export const saListStores = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request): Promise<Result<StoreListItem[]>> => {
		const auth = verifySuperAdmin(request.auth);
		if (!auth.success) {
			return { success: false, error: auth.error };
		}

		try {
			const stores = await listAllStores();
			logger.info("superAdmin.saListStores: ok", { uid: auth.uid, count: stores.length });
			return { success: true, data: stores };
		} catch (err: unknown) {
			logger.error("superAdmin.saListStores: internal error", {
				uid: auth.uid,
				err: err instanceof Error ? err.message : String(err),
			});
			return { success: false, error: "internal" };
		}
	},
);
