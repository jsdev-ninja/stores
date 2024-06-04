import fs from "node:fs/promises";

const categories = await fs.readFile("../data/categories.json");

import admin from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const app = initializeApp({
	credential: admin.credential.cert("../_secrets/opal-market-dev-firebase-adminsdk-c1buw-176855c49a.json"),
});

const firetoreDB = getFirestore(app);

firetoreDB
	.collection("products")
	.get()
	.then(() => {
		console.log("works");
	})
	.catch((err) => {
		console.error(err);
	});

const dirName = "../data/products/";
async function readFiles(dirname) {
	return await fs.readdir(dirname, { encoding: "utf-8" });
}

const files = await readFiles(dirName);

console.log("files", files);

for (const file of files) {
	const content = await fs.readFile(dirName + file, { encoding: "utf-8" });
	let json = JSON.parse(content);

	const result = json.data.map(transformProduct);

	for (const product of result) {
		// console.log("p", product);

		const res = await firetoreDB.collection("products").add(product);
		console.log("res", res.id);
	}
}

function transformProduct(product) {
	const tags = JSON.parse(product.Tags ?? "[]");

	const categoryNames = tags.map((tag) => extractStringBetweenParentheses(tag.name));
	console.log("categoryNames", categoryNames);
	const cId = categoryNames.map((name) => {
		const cat = categories.find((c) => c.name === name);

		if (!cat) return name
		return cat.name;
	});

	const baseImage = "https://aviram.blob.core.windows.net/private-product-images/shop58/";

	// console.log("categories", categories);
	const result = {
		sku: product.ProductSKU ?? product.SKU,
		name: product.Name ?? "",
		description: "",
		vat: false,
		price: product.Price ?? 0,
		currency: "ILS",
		categories: cId.filter(Boolean),
		unit: {
			type: "unit",
			value: 1,
		},
		image: baseImage + product.Image,
	};

	return result;
}

function extractStringBetweenParentheses(input) {
	const regex = /\(([^)]+)\)/;
	const match = input.match(regex);
	return match ? match[1] : input;
}
