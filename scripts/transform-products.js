import fs from "node:fs/promises";
import { firestoreDB } from "./utils/firestore.js";
import { storageApi } from "./utils/storage.js";
import axios from "axios";
const dirName = "./data/products/";
async function readFiles(dirname) {
	return await fs.readdir(dirname, { encoding: "utf-8" });
}

const storeId = "dhXXgvpn1wyTfqxoQfr0";

const categoriesResponse = await firestoreDB.doc("categories/" + storeId).get();
const categories = categoriesResponse.data().categories;
const items = flatten(categories, "", 0, null);
const separator = ">";
console.log("items", items);
let files = await readFiles(dirName);

files.sort(function (a, b) {
	return a < b || a.length < b.length ? -1 : 1;
});

files = files.slice(0, 1);
let newProducts = [];

await transform();

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
			// console.log(s);
		});
		await batch.commit();
	} catch (error) {
		console.log("batch", error);
	}
});

function flatten(items, parentId, depth, parent) {
	return items.reduce((acc, item, index) => {
		return [
			...acc,
			{
				...item,
				parentId,
				depth,
				index,
				value: parent ? `${parent.tag} > ${item.tag}` : item.tag,
			},
			...flatten(item.children, item.id, depth + 1, item),
		];
	}, []);
}

function findCategoryByTag(tag) {
	const category = items.find((c) => c.tag === tag);
	return category;
}

async function transform() {
	for (const file of files) {
		const content = await fs.readFile(dirName + file, { encoding: "utf-8" });
		let json = JSON.parse(content);
		let data = json.data;

		console.log("file", file);

		for (const product of data) {
			const tags = JSON.parse(product.Tags);

			const image = await downloadImage(product);
			// const image = null;

			const images = image ? [image] : [];

			const categoryNames = tags.map((tag) => extractStringBetweenParentheses(tag.name));
			const categoryTags = categoryNames.reduce((result, name) => {
				const cat = findCategoryByTag(name);
				if (!cat) return result;
				result.push(cat);
				if (cat.parentId) {
					const parent = items.find((c) => c.id === cat.parentId);
					if (parent) {
						result.push(parent);
					}
				}
				return result;
			}, []);

			const result = {
				storeId: "dhXXgvpn1wyTfqxoQfr0",
				companyId: "HpxoL3sSMqNmo3rAzGVk",
				sku: product.ProductSKU ?? product.SKU,
				locales: [{ lang: "he", value: product.Name || product.ProductName || "" }],
				description: "",
				vat: false,
				price: product.Price ?? 0,
				priceType: {
					type: "unit",
					value: 1,
				},
				currency: "ILS",
				categories: createCategories(categoryTags.filter(Boolean)),
				images: images,
				manufacturer: product.ProductManufacturerName ?? "",
				brand: product.ProductBrandName ?? "",
				importer: "",
				supplier: "",
				ingredients: [],
			};

			newProducts.push(result);
		}
	}
}

function createCategories(categories) {
	return {
		lvl0: categories.filter((c) => c.depth === 0).map((c) => c.value),
		lvl1: categories.filter((c) => c.depth === 1).map((c) => c.value),
		lvl2: categories.filter((c) => c.depth === 2).map((c) => c.value),
		lvl3: categories.filter((c) => c.depth === 3).map((c) => c.value),
		lvl4: categories.filter((c) => c.depth === 4).map((c) => c.value),
	};
}

function chunkArray(array, chunkSize = 400) {
	const chunks = [];
	for (let i = 0; i < array.length; i += chunkSize) {
		chunks.push(array.slice(i, i + chunkSize));
	}
	return chunks;
}

async function downloadImage(product) {
	const image = product.Image || product.ProductImage || product.ImageToShow;

	if (!image) return;

	// https://aviram.blob.core.windows.net/product-images/סנסודיילבנה.png

	try {
		// Make a GET request to the image URL
		const response = await axios({
			url: "https://aviram.blob.core.windows.net/product-images/" + image,
			method: "GET",
			responseType: "stream",
			timeout: 10000,
		});

		console.log("here 1");

		const res = await storageApi.uploadFile({
			file: response.data,
			name: `products/${storeId}/${product.SKU ?? product.ProductSKU}/` + image,
		});
		console.log("here 2");

		return res;
	} catch (error) {
		console.log("err", error?.message);
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
