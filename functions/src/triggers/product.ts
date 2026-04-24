import * as functions from "firebase-functions/v1";
import { FirebaseAPI } from "@jsdev_ninja/core";
import { catalogModule } from "../modules/catalog";

export const onProductCreate = functions.firestore
	.document(FirebaseAPI.firestore.getDocPath("products"))
	.onCreate((snap, context) => {
		console.log(snap.data(), snap.id, snap.createTime);
		console.log("AUTH", context.authType, context.auth?.uid);
		return catalogModule.syncToSearch({
			op: "upsert",
			product: { id: snap.id, ...snap.data() },
		});
	});

export const onProductDelete = functions.firestore
	.document(FirebaseAPI.firestore.getDocPath("products"))
	.onDelete((snap) =>
		catalogModule.syncToSearch({ op: "remove", productId: snap.id }),
	);

export const onProductUpdate = functions.firestore
	.document(FirebaseAPI.firestore.getDocPath("products"))
	.onUpdate((snap, context) => {
		const { id: productId } = context.params;
		return catalogModule.syncToSearch({
			op: "upsert",
			product: { id: productId, ...snap.after.data() },
		});
	});
