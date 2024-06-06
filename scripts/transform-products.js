import fs from "node:fs/promises";
import path from "node:path";
import { firestoreDB } from "./utils/firestore.js";
import axios from "axios";
import categories from "./categoriesJson.json" assert { type: "json" };
import { createWriteStream } from "node:fs";
import { storageApi } from "./utils/storage.js";

const dirName = "./data/products/";
async function readFiles(dirname) {
	return await fs.readdir(dirname, { encoding: "utf-8" });
}

const files = await readFiles(dirName);

files.sort(function (a, b) {
	return a < b || a.length < b.length ? -1 : 1;
});

let newProducts = [];

for (const file of files) {
	console.log("file", file);

	const content = await fs.readFile(dirName + file, { encoding: "utf-8" });
	let json = JSON.parse(content);
	const data = json.data;

	console.log("data", data.length);

	for (const product of data) {
		const tags = JSON.parse(product.Tags);
		// console.log(tags);

		const image = await downloadImage(product);

		const images = image ? [image] : [];

		const categoryNames = tags.map((tag) => extractStringBetweenParentheses(tag.name));
		// console.log("categoryNames", categoryNames);
		const categoryTags = categoryNames.map((name) => {
			const cat = categories.find((c) => c.tag === name);

			if (!cat) return null;

			return {
				id: cat.id,
				tag: cat.tag,
			};
		});

		// console.log("categories", categories);
		const result = {
			sku: product.ProductSKU ?? product.SKU,
			locales: [{ lang: "he", value: product.Name || product.ProductName || "" }],
			description: "",
			vat: false,
			price: product.Price ?? 0,
			categories: categoryTags.filter(Boolean),
			currency: "ILS",
			unit: getUnit(product),
			images: images,
			manufacturer: product.ProductManufacturerName ?? "",
			brand: product.ProductBrandName ?? "",
			importer: "",
			supplier: "",
			ingredients: [],
		};

		console.log(file, result.sku);

		newProducts.push(result);
	}
}

function chunkArray(array, chunkSize = 400) {
	const chunks = [];
	for (let i = 0; i < array.length; i += chunkSize) {
		chunks.push(array.slice(i, i + chunkSize));
	}
	return chunks;
}

// Example usage
const chunks = chunkArray(newProducts);

// Get a new write batch

chunks.forEach(async (chunk) => {
	try {
		const batch = firestoreDB.batch();
		const db = firestoreDB;
		chunk.forEach((s) => {
			const collectionRef = db.collection("products").doc(crypto.randomUUID());
			batch.create(collectionRef, s);
		});
		await batch.commit();
	} catch (error) {
		console.log("batch", error);
	}
});

async function downloadImage(product) {
	const image = product.Image || product.ProductImage || product.ImageToShow;

	if (!image) return;

	try {
		// Make a GET request to the image URL
		// const response = await axios({
		// 	url: baseImage,
		// 	method: "GET",
		// 	responseType: "stream",
		// });

		const res = await storageApi.uploadFile({
			file: null,
			name: "dhXXgvpn1wyTfqxoQfr0/products/" + image,
		});

		return res;
	} catch (error) {
		// console.log("err", error);
	}
}

// URL of the image to download
// Path where the image will be saved

// 	type: z.enum(["unit", "kg", "gram", "liter", "ml"]),
function getUnit(p) {
	if (p.FirstUnitMeasureName === "Gram") {
		return {
			type: "gram",
			value: 100,
		};
	}
	if (p.FirstUnitMeasureName === "Liter") {
		return {
			type: "liter",
			value: 1,
		};
	}
	if (p.FirstUnitMeasureName === "KG") {
		return {
			type: "kg",
			value: 1,
		};
	}
	if (p.FirstUnitMeasureName === "ML") {
		return {
			type: "ml",
			value: 100,
		};
	}
	return {
		type: "unit",
		value: 1,
	};
}

function extractStringBetweenParentheses(input) {
	const regex = /\(([^)]+)\)/;
	const match = input.match(regex);
	return match ? match[1] : input;
}
