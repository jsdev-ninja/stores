import { TProduct, ProductSchema } from "@jsdev_ninja/core";
import readXlsxFile from "read-excel-file/node";

import _allProducts from "./data/all-products.json";
import { admin } from "./utils/app";

const allProducts = _allProducts as any[];

// File path.
readXlsxFile("src/data/b.xlsx").then(async (rows: any[]) => {
	// `rows` is an array of rows
	// each row being an array of cells.

	const allCategories = await admin.firestore().collection("categories").doc("tester-store").get();

	const categories = allCategories.data()?.categories;

	console.log("categories", categories);

	const [headers, ...data] = rows;

	const products: TProduct[] = [];

	data.slice(0, 10).forEach((row) => {
		const [barCode, name, category, subCategory, mida, countMida, descMida, brand, price, mam] =
			row;
		// console.log(barCode, name, category, subCategory, mida, countMida, brand, price, mam);

		const selectedCategory = categories.find((c: any) => c.locales[0].name === category);
		const selectedCategory2 = categories.find((c: any) => c.locales[0].name === subCategory);
		const isNotValid = !name || !barCode || !price;

		console.log("selectedCategory", selectedCategory);
		console.log("selectedCategory2", selectedCategory2);

		const dontHavVat = mam === "לא";
		console.log("dontHavVat", dontHavVat);

		const numberPrice = Number(price);
		if (isNotValid) {
			console.log("not valid product", barCode, name, price);

			return;
		}

		const id = admin.firestore().collection("products").doc().id;
		const newProduct: TProduct = {
			id: id,
			objectID: id,
			companyId: "tester",
			storeId: "tester-store",
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
			description: [],
			discount: { type: "none", value: 0 },
			images: [],
			importer: "",
			ingredients: [],
			isPublished: true,
			priceType: { type: "gram", value: 0 },
			type: "Product",
			updated_at: Date.now(),
			volume: { unit: "none", value: 0 },
			weight: { unit: "none", value: 0 },
			profitPercentage: 0,
			purchasePrice: 0,
		};

		const validation = ProductSchema.safeParse(newProduct);
		console.log("VALIDATION", validation.success, validation.error?.errors);
	});

	console.log("total", rows.length);
	console.log("allProducts", allProducts.length);
});
