import { TCategory } from "@jsdev_ninja/core";
import { FirebaseApi } from "src/lib/firebase";
import { SentryApi } from "src/lib/sentry";
import { ProductSchema, TNewProduct, TProduct } from "@jsdev_ninja/core";

export async function productCreate(newProduct: TNewProduct) {
	const { image, ...rest } = newProduct;

	console.log("newProduct", newProduct);

	const categories = newProduct.categoryList;

	const productId = FirebaseApi.firestore.generateDocId("products");

	const categoryProps = {
		lvl0: categories.filter((c) => c.depth === 0).map((c) => renderParent(c, categories)),
		lvl1: categories.filter((c) => c.depth === 1).map((c) => renderParent(c, categories)),
		lvl2: categories.filter((c) => c.depth === 2).map((c) => renderParent(c, categories)),
		lvl3: categories.filter((c) => c.depth === 3).map((c) => renderParent(c, categories)),
		lvl4: categories.filter((c) => c.depth === 4).map((c) => renderParent(c, categories)),
	};

	const product: TProduct = {
		...rest,
		id: productId,
		objectID: productId,
		categories: { ...categoryProps },
		categoryList: categories,
		categoryNames: categories.map((c) => c.locales[0].value),
		images: [],
	};

	if (newProduct.image) {
		// upload image
		try {
			const id = crypto.randomUUID();
			const path = `products/${newProduct.storeId}/${productId}/${id}`;
			const fileRef = await FirebaseApi.storage.upload(path, newProduct.image);

			product.images = [{ id: id, url: fileRef.url }];
		} catch (error) {
			console.error(error);
			SentryApi.captureException(error);
			return { success: false };
		}
	}

	const validation = ProductSchema.safeParse(product);

	if (validation.success) {
		return await FirebaseApi.firestore.createV2({
			collection: "products",
			doc: product,
			id: productId,
		});
	} else {
		console.log("validation.error", validation.error.issues);
	}
}

function renderParent(category: TCategory, categories: TCategory[]): string {
	if (!category) return "";

	const parent = category.parentId
		? categories.find((c) => c.id === category.parentId)
		: undefined;

	const sign = parent ? " > " : "";

	if (!parent) return `${category.locales[0].value}`;

	return `${renderParent(parent, categories)}${sign}${category.locales[0].value}`;
}
