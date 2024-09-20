import { admin } from "../utils/app.js";
import { firestoreDB } from "../utils/firestore.js";

async function updateAllProducts() {
	const db = firestoreDB;
	const collectionRef = db.collection("products"); // Your collection name
	const batchSize = 500; // Max batch size allowed by Firestore
	let query = collectionRef.limit(batchSize); // Start with the first batch
	let batchCount = 0;

	do {
		const snapshot = await query.get();
		if (snapshot.empty) {
			console.log("No more documents to update.");
			break;
		}

		const batch = db.batch();

		snapshot.docs.forEach((doc) => {
			const docRef = collectionRef.doc(doc.id);
			const categories = doc.data().categoryList ?? [];
			if (!doc.data().categoryList) {
				console.log(doc.id, doc.data().name);
			}
			batch.update(docRef, {
				// 	// Your update fields here
				categoryNames: categories.map((c) => c.locales[0].value),
			});

			// remove field

			// batch.update(docRef, {
			// 	philip: admin.firestore.FieldValue.delete(), // Delete the specified field
			// });
		});

		await batch.commit();
		batchCount++;
		console.log(`Batch ${batchCount} committed successfully.`);

		// Set up the next query to start after the last document in the snapshot
		const lastDoc = snapshot.docs[snapshot.docs.length - 1];
		query = collectionRef.startAfter(lastDoc).limit(batchSize);
	} while (true);
}

updateAllProducts()
	.then(() => console.log("All products updated successfully."))
	.catch((error) => console.error("Error updating products:", error));
