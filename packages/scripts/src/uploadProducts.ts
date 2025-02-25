import { TProduct, ProductSchema, TCategory, FirebaseAPI } from "@jsdev_ninja/core";
import { getDownloadURL } from "firebase-admin/storage";
import _allProducts from "./data/all-products.json";
import axios from "axios";
import { admin } from "./admin";

// const readXlsxFile = require("read-excel-file/node");
import readXlsxFile from "read-excel-file/node";
const allProducts = _allProducts as any[];

console.log("readXlsxFile", readXlsxFile);

const companyId = "balasistore_company";
const storeId = "balasistore_store";

function renderParent(category: TCategory, categories: TCategory[]): string {
	if (!category) return "";

	const parent = category.parentId
		? categories.find((c) => c.id === category.parentId)
		: undefined;

	const sign = parent ? " > " : "";

	if (!parent) return `${category.locales[0].value}`;

	return `${renderParent(parent, categories)}${sign}${category.locales[0].value}`;
}

// File path.
readXlsxFile("src/data/products.xlsx").then(async (rows: any[]) => {
	try {
		// `rows` is an array of rows
		// each row being an array of cells.

		// const allCategories = await admin.firestore().collection("categories").doc("tester-store").get();

		const [headers, ...data] = rows;

		console.log("headers", headers);

		const products: TProduct[] = [];

		const categoriesMap: Record<string, TCategory> = {};

		for (const row of data) {
			const [
				barCode,
				name,
				category,
				subCategory,
				priceType,
				volumeType,
				volumeValue,
				description,
				brand,
				price,
				mam,
			] = row;

			const isNotValid = !name || !barCode || !price;

			const numberPrice = Number(price);
			if (isNotValid) {
				// console.log("not valid product", barCode, name, price);
				continue;
			}

			const hasVolume = ["ליטר", "מל"].includes(volumeType);
			const hasWeight = ["גרם", "קג"].includes(volumeType);
			const _weightValue = Number(volumeValue);
			const _volumeValue = Number(volumeValue);

			const namesMap: any = {
				["קג"]: "kg",
				["גרם"]: "gram",
				["ליטר"]: "liter",
				["מל"]: "ml",
			};

			const dontHavVat = mam === "לא";
			const isKg = priceType === `ק"ג`;

			const productDetails: any = allProducts.find(
				(p: any) => p.SKU == barCode.toString() || p.ProductSKU == barCode.toString()
			);

			const image: any = await downloadImage(productDetails, barCode.toString());
			// const image: any = null;

			const newProduct: TProduct = {
				id: barCode.toString(),
				objectID: barCode.toString(),
				companyId: companyId,
				storeId: storeId,
				sku: barCode.toString(),
				name: [
					{
						lang: "he",
						value: name,
					},
				],
				vat: !dontHavVat,
				brand: brand ?? "",
				manufacturer: brand ?? "",
				price: numberPrice,
				supplier: "",
				categories: { lvl0: [], lvl1: [], lvl2: [], lvl3: [], lvl4: [] },
				categoryList: [],
				categoryNames: [],
				created_at: Date.now(),
				currency: "ILS",
				description: [{ lang: "he", value: description ?? " " }],
				discount: { type: "none", value: 0 },
				images: image ? [image] : [],
				importer: "",
				ingredients: [],
				isPublished: true,
				priceType: { type: isKg ? "kg" : "unit", value: 1 },
				type: "Product",
				updated_at: Date.now(),
				volume: {
					unit: hasVolume ? (namesMap[volumeType as any] as any) : "none",
					value: isNaN(_volumeValue) ? 0 : _volumeValue,
				},
				weight: {
					unit: hasWeight ? (namesMap[volumeType as any] as any) : "none",
					value: isNaN(_weightValue) ? 0 : _weightValue,
				},
				profitPercentage: 0,
				purchasePrice: 0,
			};

			if (category) {
				const categoryId = crypto.randomUUID();

				const existsCategory = categoriesMap[category];

				const _category: TCategory = existsCategory ?? {
					companyId,
					storeId,
					depth: 0,
					id: categoryId,
					locales: [{ lang: "he", value: category }],
					parentId: "",
					tag: "tag", //todo
					children: [],
				};
				if (!existsCategory) {
					categoriesMap[category] = _category;
				}

				if (subCategory) {
					const existsSubCategory = _category.children.find(
						(c) => c.locales[0].value === subCategory
					);

					const _subCategory: TCategory = existsSubCategory ?? {
						companyId,
						storeId,
						depth: 1,
						id: crypto.randomUUID(),
						locales: [{ lang: "he", value: subCategory }],
						parentId: categoryId,
						tag: "tag", //todo
						children: [],
					};
					!existsSubCategory && _category.children.push(_subCategory);

					newProduct.categoryList = [_category];
					newProduct.categories = {
						lvl0: newProduct.categoryList
							.filter((c) => c.depth === 0)
							.map((c) => renderParent(c, newProduct.categoryList)),
						lvl1: _category.children
							.filter((c) => c.depth === 1 && c.locales[0].value === subCategory)
							.map((c) => renderParent(c, [_category])),
						lvl2: [],
						lvl3: [],
						lvl4: [],
					};
					newProduct.categoryNames = [];
					if (category) {
						newProduct.categoryNames.push(category);
					}
					if (subCategory) {
						newProduct.categoryNames.push(subCategory);
					}
				}
			}

			const validation = ProductSchema.safeParse(newProduct);
			console.log("VALIDATION", validation.success, validation.error?.errors);
			if (validation.success) {
				//
				products.push(validation.data);
			}
		}

		// upload products
		updateAllProducts(products);
		// upload category
		await admin
			.firestore()
			.collection(`${companyId}/${storeId}/categories`)
			.doc("categories")
			.set({
				categories: Object.values(categoriesMap),
			});

		// console.log("total", rows.length);
		// console.log("allProducts", allProducts.length);
	} catch (error) {
		console.log("ERRRRRRR", error);
	}
});

async function updateAllProducts(products: any) {
	console.log("updateAllProducts", products.length);

	const db = admin.firestore();

	const chunks = chunkArray(products);

	chunks.forEach(async (chunk: any) => {
		try {
			const batch = db.batch();
			chunk.forEach((s: any) => {
				const collectionRef = db
					.collection(
						FirebaseAPI.firestore.getPath({
							collectionName: "products",
							companyId,
							storeId,
						})
					)
					.doc(s.id);
				batch.set(collectionRef, s, { merge: true });
				// console.log(s);
			});
			await batch.commit();
			console.log("SUCCESS");
		} catch (error) {
			console.log("batch", error);
		}
	});
}

function chunkArray(array: any, chunkSize: any = 400) {
	const chunks: any = [];
	for (let i = 0; i < array.length; i += chunkSize) {
		chunks.push(array.slice(i, i + chunkSize));
	}
	return chunks;
}

async function downloadImage(product: any, id: any) {
	if (!product) return;

	const image = product?.Image || product?.ProductImage || product?.ImageToShow;

	if (!image) return;

	// https://aviram.blob.core.windows.net/product-images/111777889900052.png

	try {
		// Make a GET request to the image URL
		const response = await axios({
			url: "https://aviram.blob.core.windows.net/product-images/" + image,
			method: "GET",
			responseType: "stream",
			timeout: 10000,
		});

		// console.log("IMAGE", response.status);

		const res: any = await uploadFile({
			file: response.data,
			name: `${companyId}/${storeId}/products/${product.SKU || product.ProductSKU}/` + image,
		});

		return { url: res.url, id: crypto.randomUUID() };
	} catch (error: any) {
		// console.log("err", error?.message);
	}
}

async function uploadFile({ file, name }: any) {
	const storage = admin.storage();
	return new Promise((resolve, reject) => {
		file
			.pipe(storage.bucket().file(name).createWriteStream())
			.on("finish", async () => {
				const a = storage.bucket().file(name);
				const url = await getDownloadURL(a);
				resolve({ url, id: crypto.randomUUID() });
			})
			.on("error", (e: any) => {
				console.log("E", e?.message);
				reject();
			});
	});
}
