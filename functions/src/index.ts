import admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

admin.initializeApp({});

export const onProductCreate = functions.firestore
	.document("/products/{productId}")
	.onCreate((snap, context) => {
		console.log(snap.data(), snap.id, snap.createTime);
		console.log(context);
	});
