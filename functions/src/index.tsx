import admin from "firebase-admin";
import * as functions from "firebase-functions/v1";
import React from "react";
import algoliasearch from "algoliasearch";
import { emailService } from "./services/email";
import { render } from "@react-email/render";
import { NewOrderEmail } from "./emails";

const algolia = algoliasearch("633V4WVLUB", "2f3dbcf0c588a92a1e553020254ddb3a");

const index = algolia.initIndex("products");

admin.initializeApp({});

export { appInit } from "./api/init";
export { getMixpanelData } from "./api/mixpanel-ts";
export { createCompanyClient } from "./api/createCompany";

export const onOrderCreate = functions.firestore
	.document("/orders/{orderId}")
	.onCreate(async (snap) => {
		const order: any = { ...snap.data(), id: snap.id };

		const cardId = order.cartId;

		const html = await render(<NewOrderEmail />);

		await emailService.sendEmail({
			html,
		});

		return admin.firestore().collection("cart").doc(cardId).update({
			status: "completed",
		});
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
	.onDelete(async (snap, context) => {
		console.log(snap.data(), snap.id, snap.createTime);
		console.log(context);
		return await index.deleteObject(snap.id);
	});

export const onProductUpdate = functions.firestore
	.document("/products/{productId}")
	.onUpdate(async (snap, context) => {
		const before = snap.before.data();
		const after = snap.after.data();

		const { productId } = context.params;

		console.log("update ", productId, after, before);
		return await index.saveObject({
			objectID: productId,
			id: productId,
			...after,
		});
	});

export const onUserCreate = functions.auth.user().onCreate((user) => {
	console.info("user created", user.uid, user.displayName, user.email);
	const email = user.email; // The email of the user.
	const displayName = user.displayName; // The display name of the user.
	const uid = user.uid; // The UID of the user.
	const isAnonymous = user.providerData.length === 0;

	if (isAnonymous) {
		return;
	}
	// todo
	// Example: Add the user to Firestore
	const db = admin.firestore();
	return db
		.collection("profiles")
		.doc(uid)
		.set({
			email: email,
			displayName: displayName || email,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
		})
		.then(() => {
			console.log("User document created in Firestore");
		})
		.catch((error) => {
			console.error("Error creating user document in Firestore", error);
		});
});
