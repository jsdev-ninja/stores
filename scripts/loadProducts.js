import { firestoreDB } from "./utils/firestore.js";

import algoliasearch from "algoliasearch";

const shapshot = await firestoreDB.collection("products").get();

const algolia = algoliasearch("633V4WVLUB", "2f3dbcf0c588a92a1e553020254ddb3a");
let products = [];

const index = algolia.initIndex("products");

shapshot.forEach((doc) => {
	const product = {
		...doc.data(),
		id: doc.id,
	};
	products.push(product);
});

console.log("products", products.length);

products = products.map((product) => {
	return {
		...product,
		objectID: product.id,
	};
});

index
	.saveObjects(products)
	.then(() => {
		console.log("success");
	})
	.catch((err) => console.log(err));
