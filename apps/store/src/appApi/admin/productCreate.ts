import { FirebaseAPI } from "@jsdev_ninja/core";
import { FirebaseApi } from "src/lib/firebase";
import { api, CreateProductResult } from "src/lib/firebase/api";
import { SentryApi } from "src/lib/sentry";
import { ProductSchema, TNewProduct, TProduct } from "@jsdev_ninja/core";
import { removeUndefinedFields } from "src/utils/removeUndefinedFields";

async function resolveImages(
	newProduct: TNewProduct,
	product: TProduct,
): Promise<{ success: boolean; product: TProduct }> {
	const { image } = newProduct;

	if (!image) {
		return { success: true, product };
	}

	try {
		const id = crypto.randomUUID();
		const path = `${newProduct.companyId}/${newProduct.storeId}/products/${product.id}/${id}`;
		const fileRef = await FirebaseApi.storage.upload(path, image);

		// remove all image
		if (newProduct.images?.[0]) {
			await FirebaseApi.storage.remove(newProduct.images?.[0].url);
		}

		return { success: true, product: { ...product, images: [{ id, url: fileRef.url }] } };
	} catch (error) {
		console.error(error);
		SentryApi.captureException(error);
		return { success: false, product };
	}
}

function buildProduct(newProduct: TNewProduct): TProduct {
	const { image, ...rest } = newProduct;
	const productId = newProduct.sku;
	return {
		...rest,
		id: productId,
		objectID: productId,
		images: newProduct.images ?? [],
	};
}

export async function productCreate(newProduct: TNewProduct): Promise<CreateProductResult> {
	const base = buildProduct(newProduct);
	const { success, product } = await resolveImages(newProduct, base);

	if (!success) {
		return { success: false, reason: "unknown", message: "Image upload failed" };
	}

	return api.createProduct(product);
}

export async function productSave(newProduct: TNewProduct) {
	const base = buildProduct(newProduct);
	const { success, product } = await resolveImages(newProduct, base);

	if (!success) {
		return { success: false };
	}

	const validation = ProductSchema.safeParse(product);

	if (validation.success) {
		return await FirebaseApi.firestore.setV2({
			collection: FirebaseAPI.firestore.getPath({
				storeId: product.storeId,
				companyId: product.companyId,
				collectionName: "products",
			}),
			doc: removeUndefinedFields(product),
		});
	} else {
		console.error("validation.error", validation.error.issues);
	}
}
