import { firestoreDB } from "./utils/firestore.js";

import categoryJson from "./data/category.json" assert { type: "json" };

const storeId = "tester-store";
const companyId = "tester";

main();

// id: z.string().min(1),
// companyId: z.string().min(1),
// storeId: z.string().min(1),
// parentId: z.string().min(1),
// tag: z.string().min(1),
// locales: z.array(LocaleSchema),

async function main() {
	const rootCategory = categoryJson.filter((category) => !category.parentCategoryInShopID);

	console.log(rootCategory, rootCategory.length);

	const categories = rootCategory.map(createCategory);

	categories.forEach((category) => {
		const children = categoryJson.filter(
			(child) => child.parentCategoryInShopID?.toString() === category.id
		);
		category.children = children.map((c) => createCategory(c, category.id));
	});

	// Set the value of 'NYC'

	// Commit the batch
	const res = await firestoreDB.collection("categories").doc(storeId).set({
		categories: categories,
	});
	console.log("success", res);
}

function createCategory(category, parentId = "") {
	return {
		id: category.id.toString(),
		storeId,
		companyId,
		parentId: parentId.toString(),
		tag: category.tag,
		locales: [
			{
				lang: "he-IL",
				value: category.name,
			},
		],
		children: [],
	};
}
