import admin from "firebase-admin";
import * as functions from "firebase-functions/v1";
import * as functionsV2 from "firebase-functions/v2";
import React from "react";
import algoliasearch from "algoliasearch";
import { emailService } from "./services/email";
import { render } from "@react-email/render";
import OrderCreated from "./emails/OrderCreated";
import { FirebaseAPI, TOrder } from "@jsdev_ninja/core";

const algolia = algoliasearch("633V4WVLUB", "2f3dbcf0c588a92a1e553020254ddb3a");

const index = algolia.initIndex("products");

admin.initializeApp({});

export const uiLogs = functionsV2.https.onCall((opts) => {
	const { data } = opts;
	functionsV2.logger.write(data);
});

export { appInit } from "./api/init";
export { getMixpanelData } from "./api/mixpanel-ts";
export { createCompanyClient } from "./api/createCompany";
export { createPayment } from "./api/createPayment";
export * from "./api/chargeOrder";

export const onOrderCreated = functions.firestore
	.document(FirebaseAPI.firestore.getDocPath("orders"))
	.onCreate(async (snap, context) => {
		const { storeId, companyId } = context.params;

		const order = snap.data() as TOrder;

		// todo validate order

		return admin
			.firestore()
			.collection(FirebaseAPI.firestore.getPath({ collectionName: "cart", companyId, storeId }))
			.doc(order.cart.id)
			.update({
				status: "completed",
			});
	});
export const onOrderUpdate = functions.firestore
	.document("/orders/{orderId}")
	.onUpdate(async (snap, context) => {
		const { orderId } = context.params;
		const after = snap.after.data() as TOrder;
		const before = snap.before.data() as TOrder;

		const orderIsPaid = after.paymentStatus === "completed" && before.paymentStatus === "pending";

		if (orderIsPaid) {
			console.log("order paid", orderId);
			const html = await render(<OrderCreated order={after} />);

			await emailService.sendEmail({
				html,
			});

			return admin.firestore().collection("cart").doc(after.cart.id).update({
				status: "completed",
			});
		}

		return;
	});

export const onProductCreate = functions.firestore
	.document(FirebaseAPI.firestore.getDocPath("products"))
	.onCreate(async (snap, context) => {
		console.log(snap.data(), snap.id, snap.createTime);
		console.log("AUTH", context.authType, context.auth?.uid);

		return await index.saveObject({
			...snap.data(),
			id: snap.id,
			objectID: snap.id,
		});
	});

export const onProductDelete = functions.firestore
	.document(FirebaseAPI.firestore.getDocPath("products"))
	.onDelete(async (snap) => {
		return await index.deleteObject(snap.id);
	});

export const onProductUpdate = functions.firestore
	.document(FirebaseAPI.firestore.getDocPath("products"))
	.onUpdate(async (snap, context) => {
		const after = snap.after.data();

		const { id: productId } = context.params;

		return await index.saveObject({
			objectID: productId,
			id: productId,
			...after,
		});
	});

export const onUserDelete = functions.auth.user().onDelete((user) => {
	console.info("user deleted", user.uid, user.displayName, user.email);
	const uid = user.uid; // The UID of the user.

	const db = admin.firestore();
	return db
		.collection("profiles")
		.doc(uid)
		.delete()
		.then(() => {
			console.log("User document deleted in Firestore");
		})
		.catch((error) => {
			console.error("Error deleting user document in Firestore", error);
		});
});
