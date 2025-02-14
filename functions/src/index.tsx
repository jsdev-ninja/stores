import admin from "firebase-admin";
import * as functions from "firebase-functions/v1";
import React from "react";
import algoliasearch from "algoliasearch";
import { emailService } from "./services/email";
import { render } from "@react-email/render";
import OrderCreated from "./emails/OrderCreated";
import { TOrder, TProfile, createEmptyProfile } from "@jsdev_ninja/core";

const algolia = algoliasearch("633V4WVLUB", "2f3dbcf0c588a92a1e553020254ddb3a");

const index = algolia.initIndex("products");

admin.initializeApp({});

export { appInit } from "./api/init";
export { getMixpanelData } from "./api/mixpanel-ts";
export { createCompanyClient } from "./api/createCompany";
export { createPayment } from "./api/createPayment";
export { chargeOrder } from "./api/chargeOrder";

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
	.document("/products/{productId}")
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
	.document("/products/{productId}")
	.onDelete(async (snap) => {
		return await index.deleteObject(snap.id);
	});

export const onProductUpdate = functions.firestore
	.document("/products/{productId}")
	.onUpdate(async (snap, context) => {
		const after = snap.after.data();

		const { productId } = context.params;

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
