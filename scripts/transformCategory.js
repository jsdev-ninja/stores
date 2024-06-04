import { firestoreDB } from "./utils/firestore.js";

import categoryJson from "./data/category.json" assert { type: "json" };

const storeId = "dhXXgvpn1wyTfqxoQfr0";
const companyId = "HpxoL3sSMqNmo3rAzGVk";

main();

async function main() {
	const categories = categoryJson.map((category) => {
		const parentId = category.parentCategoryInShopID
			? category.parentCategoryInShopID.toString()
			: "";

		return {
			id: category.id.toString(),
			storeId,
			companyId,
			parentId,
			tag: category.tag,
			locales: [
				{
					lang: "he-IL",
					value: category.name,
				},
			],
		};
	});
	console.log("categories", categories.length);

	const db = firestoreDB;

	// Get a new write batch
	const batch = db.batch();

	categories.forEach((c) => {
		const collectionRef = db.collection("categories").doc(c.id);
		delete c.id;
		batch.set(collectionRef, c);
	});

	// Set the value of 'NYC'

	// Commit the batch
	await batch.commit();
	console.log("success");
}
