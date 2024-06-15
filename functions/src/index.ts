import admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

admin.initializeApp({});

export const onProductCreate = functions.firestore
	.document("/products/{productId}")
	.onCreate((snap, context) => {
		console.log(snap.data(), snap.id, snap.createTime);
		console.log(context);
	});

export const onUserCreate = functions.auth.user().onCreate((user) => {
	console.info("user created", user.uid, user.displayName, user.email);
	const email = user.email; // The email of the user.
	const displayName = user.displayName; // The display name of the user.
	const uid = user.uid; // The UID of the user.

	// Example: Add the user to Firestore
	const db = admin.firestore();
	return db
		.collection("users")
		.doc(uid)
		.set({
			email: email,
			displayName: displayName,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
		})
		.then(() => {
			console.log("User document created in Firestore");
		})
		.catch((error) => {
			console.error("Error creating user document in Firestore", error);
		});
});
