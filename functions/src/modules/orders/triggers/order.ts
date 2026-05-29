import * as functions from "firebase-functions/v1";
import { FirebaseAPI, TOrder } from "@jsdev_ninja/core";
import { handleOrderCreated, handleOrderUpdated } from "../internal/lifecycle";

export const onOrderCreated = functions.firestore
	.document(FirebaseAPI.firestore.getDocPath("orders"))
	.onCreate(async (snap, context) => {
		const { storeId, companyId, id } = context.params;
		const order = snap.data() as TOrder;
		await handleOrderCreated({ order, orderId: id, companyId, storeId });
	});

export const onOrderUpdate = functions
	.runWith({ memory: "1GB", timeoutSeconds: 540 })
	.firestore.document(FirebaseAPI.firestore.getDocPath("orders"))
	.onUpdate(async (snap, context) => {
		const { storeId, companyId, id } = context.params;
		const before = snap.before.data() as TOrder;
		const after = snap.after.data() as TOrder;
		await handleOrderUpdated({ before, after, orderId: id, companyId, storeId });
	});
