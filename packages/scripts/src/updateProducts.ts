import { TProduct, ProductSchema, TCategory, FirebaseAPI } from "@jsdev_ninja/core";
import { getDownloadURL } from "firebase-admin/storage";
import _allProducts from "./data/all-products.json";
import axios from "axios";
import { admin } from "./admin";

// const readXlsxFile = require("read-excel-file/node");

const companyId = "balasistore_company";
const storeId = "balasistore_store";

const db = admin.firestore();

main();

async function main() {
	try {
		// Function to process a single collection
		const collectionRef = db.collection(
			FirebaseAPI.firestore.getPath({
				collectionName: "products",
				companyId,
				storeId,
			})
		);
		const snapshot = await collectionRef.get();
		console.log("snapshot", snapshot.size);

		// Create a batch for efficient updates
		let batch = db.batch();
		let batchOperations = 0;

		// Iterate through documents
		for (let doc of snapshot.docs) {
			const docRef = collectionRef.doc(doc.id);
			const docData = doc.data() as TProduct;

			// Example update operations
			// admin.firestore.FieldValue.delete()
			const updateData: Partial<TProduct> = {
				categoryIds: docData.categoryList.map((c) => c.id),
			};

			// Add to batch update
			batch.update(docRef, updateData);
			batchOperations++;

			// Commit batch when it reaches 500 operations
			if (batchOperations >= 500) {
				await batch.commit();
				console.log("commint");

				batch = db.batch();
				batchOperations = 0;
			}
		}

		// Commit any remaining batch operations
		if (batchOperations > 0) {
			await batch.commit();
		}

		console.log("Collection traversal and update complete");
	} catch (error) {
		console.error("Error in traverseAndUpdateCollections:", error);
	}
}
