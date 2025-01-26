import * as functionsV2 from "firebase-functions/v2";
import admin from "firebase-admin";

// functionsV2.https.onRequest
export const appInit = functionsV2.https.onCall(async (request) => {
	console.log("init", request.rawRequest.headers.origin);
	// http://localhost:5173
	const origin = request.rawRequest.headers.origin;

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

	const storesRef = db
		.collection("stores")
		.where("companyId", "==", doc.id)
		.where("urls", "array-contains", origin);
	const stores = await storesRef.get();

	console.log("init found stores:", stores.size);

	const storeDoc = stores.docs[0];
	const store = storeDoc.data();
	store.id = storeDoc.id;
	return { company, store };
});
