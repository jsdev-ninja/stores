/**
 * storesStore — root STORES reader for the superAdmin module.
 *
 * The ONE documented root-collection exception in this module.
 * All other reads go through paths.ts (getPath / tenant-scoped).
 *
 * Mirrors the enumeration pattern used by reconcileProjectionsSchedule
 * (budget/triggers/reconcileProjectionsSchedule.ts) — full collection.get()
 * against the root STORES collection.
 */
import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import type { StoreListItem } from "../contracts";

/**
 * Returns a lean projection of every store in the root STORES collection.
 * Used exclusively by saListStores — the documented root-collection exception.
 */
export async function listAllStores(): Promise<StoreListItem[]> {
	const db = admin.firestore();
	const snap = await db.collection("STORES").get();

	const items: StoreListItem[] = [];

	for (const doc of snap.docs) {
		const data = doc.data();
		const companyId = typeof data.companyId === "string" ? data.companyId : null;
		if (!companyId) {
			logger.warn("superAdmin.storesStore.listAllStores: store missing companyId, skipping", {
				storeId: doc.id,
			});
			continue;
		}

		const name = typeof data.name === "string" ? data.name : doc.id;
		const urls = Array.isArray(data.urls)
			? (data.urls as unknown[]).filter((u): u is string => typeof u === "string")
			: [];

		items.push({
			id: doc.id,
			companyId,
			name,
			urls,
		});
	}

	logger.info("superAdmin.storesStore.listAllStores: complete", { count: items.length });

	return items;
}
