import * as functions from "firebase-functions/v1";
import { FirebaseAPI } from "@jsdev_ninja/core";
import diff from "microdiff";
import { searchSync } from "../internal/searchSync";

export const onProductCreate = functions.firestore
	.document(FirebaseAPI.firestore.getDocPath("products"))
	.onCreate((snap, context) => {
		const { companyId, storeId } = context.params;
		functions.logger.info("onProductCreate", { productId: snap.id, companyId, storeId, product: snap.data() });
		return searchSync.upsert({ id: snap.id, ...snap.data() });
	});

export const onProductDelete = functions.firestore
	.document(FirebaseAPI.firestore.getDocPath("products"))
	.onDelete((snap) => searchSync.remove(snap.id));

export const onProductUpdate = functions.firestore
	.document(FirebaseAPI.firestore.getDocPath("products"))
	.onUpdate((snap, context) => {
		const { id: productId, companyId, storeId } = context.params;
		functions.logger.info("onProductUpdate", {
			productId,
			companyId,
			storeId,
			changes: diff(snap.before.data() ?? {}, snap.after.data() ?? {}),
		});
		return searchSync.upsert({ id: productId, ...snap.after.data() });
	});
