import * as functions from "firebase-functions/v1";
import admin from "firebase-admin";

export const appInit = functions.https.onCall(async (data, context) => {
	console.log("init", context.rawRequest.headers.origin);
	// http://localhost:5173
	const origin = context.rawRequest.headers.origin;

	const db = admin.firestore();

	const companiesRef = db
		.collection("companies")
		.where("websiteDomains", "array-contains", origin);

	const companies = await companiesRef.get();

	console.log("init found companies:", companies.size);

	const doc = companies.docs[0];
	const company = doc.data();
	company.id = doc.id;

	// store

	const storesRef = db.collection("stores").where("companyId", "==", doc.id);
	.where("url", "==", origin);
	const stores = await storesRef.get();

	console.log("init found stores:", stores.size);

	const storeDoc = stores.docs[0];
	const store = storeDoc.data();
	store.id = storeDoc.id;
	return { company, store };
});
