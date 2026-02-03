import { FirebaseAPI } from "@jsdev_ninja/core";
import { FirebaseApi } from "src/lib/firebase";
import { SentryApi } from "src/lib/sentry";
import { ProductSchema, TNewProduct, TProduct } from "@jsdev_ninja/core";
import { removeUndefinedFields } from "src/utils/removeUndefinedFields";

export async function productCreate(newProduct: TNewProduct) {
	const { image, ...rest } = newProduct;

	console.log('newProduct', newProduct)

	const productId = newProduct.sku;

	const product: TProduct = {
		...rest,
		id: productId,
		objectID: productId,
		images: newProduct.images ?? [],
	};

	if (image) {
		// upload image
		try {
			const id = crypto.randomUUID();
			const path = `${newProduct.companyId}/${newProduct.storeId}/products/${productId}/${id}`;
			const fileRef = await FirebaseApi.storage.upload(path, image);

			// remove all image
			if (newProduct.images?.[0]) {
				await FirebaseApi.storage.remove(newProduct.images?.[0].url);
			}

			product.images = [{ id: id, url: fileRef.url }];
		} catch (error) {
			console.error(error);
			SentryApi.captureException(error);
			return { success: false };
		}
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
