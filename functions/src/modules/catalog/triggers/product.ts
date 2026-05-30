import * as functions from "firebase-functions/v1";
import { FirebaseAPI } from "@jsdev_ninja/core";
import diff from "microdiff";
import { searchSync } from "../internal/searchSync";
import { productStorage } from "../internal/productStorage";

export const onProductCreate = functions.firestore
	.document(FirebaseAPI.firestore.getDocPath("products"))
	.onCreate(async (snap, context) => {
		const { companyId, storeId } = context.params;
		functions.logger.info("onProductCreate", { productId: snap.id, companyId, storeId, product: snap.data() });
		try {
			await searchSync.upsert({ id: snap.id, ...snap.data() });
			functions.logger.info("onProductCreate: search index synced", { productId: snap.id });
		} catch (err) {
			functions.logger.error("onProductCreate: search sync failed", { productId: snap.id, err });
			throw err;
		}
	});

export const onProductDelete = functions.firestore
	.document(FirebaseAPI.firestore.getDocPath("products"))
	.onDelete(async (snap, context) => {
		const { companyId, storeId } = context.params;
		functions.logger.info("onProductDelete", { productId: snap.id, companyId, storeId });
		try {
			await searchSync.remove(snap.id);
			functions.logger.info("onProductDelete: search index removed", { productId: snap.id });
		} catch (err) {
			functions.logger.error("onProductDelete: search sync failed", { productId: snap.id, err });
			throw err;
		}
		try {
			await productStorage.removeAllImages({ companyId, storeId, productId: snap.id });
			functions.logger.info("onProductDelete: storage images removed", { productId: snap.id });
		} catch (err) {
			functions.logger.error("onProductDelete: storage cleanup failed", { productId: snap.id, err });
			// best-effort — do not rethrow (avoid retry loop; Algolia already removed)
		}
	});

export const onProductUpdate = functions.firestore
	.document(FirebaseAPI.firestore.getDocPath("products"))
	.onUpdate(async (snap, context) => {
		const { id: productId, companyId, storeId } = context.params;
		functions.logger.info("onProductUpdate", {
			productId,
			companyId,
			storeId,
			changes: diff(snap.before.data() ?? {}, snap.after.data() ?? {}),
		});
		try {
			await searchSync.upsert({ id: productId, ...snap.after.data() });
			functions.logger.info("onProductUpdate: search index synced", { productId });
		} catch (err) {
			functions.logger.error("onProductUpdate: search sync failed", { productId, err });
			throw err;
		}
	});
