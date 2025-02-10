import fs from "node:fs/promises";
import { firestoreDB } from "./utils/firestore.js";
import { storageApi } from "./utils/storage.js";
import axios from "axios";
import { ProductSchema } from "./schema/productSchema.js";
const dirName = "./data/products/";

async function readFiles(dirname) {
	return await fs.readdir(dirname, { encoding: "utf-8" });
}

const storeId = "opal-market-store";
const companyId = "opal-market";

const categoriesResponse = await firestoreDB.doc("categories/" + storeId).get();
const categories = categoriesResponse.data().categories;

const items = flatten(categories, "", 0, null);

let newProducts = [];

// start script
main();
async function main() {
	// get files
	let files = await readFiles(dirName);
	files.sort(function (a, b) {
		return a < b || a.length < b.length ? -1 : 1;
	});

	for (const file of files) {
		console.log("file", file);
		const content = await fs.readFile(dirName + file, { encoding: "utf-8" });
		let json = JSON.parse(content);
		let products = json.data;
		console.log("products", products.length);

		for (const product of products) {
			const tags = JSON.parse(product.Tags);

			if (!product.UnlimitedQuantity) {
				continue;
			}

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

			const image = await downloadImage(product);
			// const image = null;

			const images = image ? [image] : [];

			const sku = product.ProductSKU ?? product.SKU;

			const result = {
				type: "Product",
				storeId: storeId,
				companyId: companyId,
				id: sku,
				sku: sku,
				locales: [{ lang: "he", value: product.Name || product.ProductName || "" }],
				description: "",
				vat: false,
				price: removeVAT(product.Price) ?? 0,
				priceType: {
					type: "unit",
					value: 1,
				},
				currency: "ILS",
				categories: createCategories(categoryTags.filter(Boolean)),
				categoryList: categoryTags,
				images: images,
				manufacturer: product.ProductManufacturerName ?? "",
				brand: product.ProductBrandName ?? "",
				importer: "",
				supplier: "",
				ingredients: [],
				weight: {
					value: 0,
					unit: "none",
				},
				volume: {
					value: 0,
					unit: "none",
				},
				discount: {
					type: "none",
					value: 0,
				},
			};

			const schema = ProductSchema.safeParse(result);

			console.log("schema", schema.success);

			if (!schema.success) {
				schema.error.issues.map((e) => console.log(e));
				process.exit(1);
			}

			newProducts.push(result);
		}
	}

	createChunk();
}

function removeVAT(grossPrice, vatRate = 17) {
	const netPrice = grossPrice / (1 + vatRate / 100);
	return parseFloat(netPrice.toFixed(2)); // Format the result to 2 decimal places
}

function createChunk() {
	const chunks = chunkArray(newProducts);

	chunks.forEach(async (chunk) => {
		try {
			const batch = firestoreDB.batch();
			const db = firestoreDB;
			chunk.forEach((s) => {
				const collectionRef = db.collection("products").doc(s.sku);
				batch.create(collectionRef, s);
				// console.log(s);
			});
			await batch.commit();
		} catch (error) {
			console.log("batch", error);
		}
	});
}

function flatten(items, parentId, depth, parent) {
	return items.reduce((acc, item, index) => {
		return [
			...acc,
			{
				...item,
				parentId: parentId && parentId.toString(),
				depth,
				index,
				value: parent
					? `${parent.locales[0].value} > ${item.locales[0].value}`
					: item.locales[0].value,
			},
			...flatten(item.children, item.id, depth + 1, item),
		];
	}, []);
}

function findCategoryByTag(tag) {
	const category = items.find((c) => c.tag === tag);
	return category;
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

	// https://aviram.blob.core.windows.net/product-images/111777889900052.png

	try {
		// Make a GET request to the image URL
		// const response = await axios({
		// 	url: "https://aviram.blob.core.windows.net/product-images/" + image,
		// 	method: "GET",
		// 	responseType: "stream",
		// 	timeout: 10000,
		// });

		// const res = await storageApi.uploadFile({
		// 	file: response.data,
		// 	name: `products/${storeId}/${product.SKU ?? product.ProductSKU}/` + image,
		// });

		const url = await storageApi.getUrl({
			name: `products/${storeId}/${product.SKU ?? product.ProductSKU}/` + image,
		});
		return { url, id: crypto.randomUUID() };
	} catch (error) {
		console.log("err", error?.message);
	}
}

function extractStringBetweenParentheses(input) {
	const regex = /\(([^)]+)\)/;
	const match = input.match(regex);
	return match ? match[1] : input;
}
