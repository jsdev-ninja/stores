import { FirebaseAPI } from "@jsdev_ninja/core";

export function productPath(companyId: string, storeId: string, productId: string): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "products",
		id: productId,
	});
}

export function productsCollectionPath(companyId: string, storeId: string): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "products",
	});
}

/**
 * The single categories document that holds the full category tree.
 * Path: {companyId}/{storeId}/categories/categories
 */
export function categoriesDocPath(companyId: string, storeId: string): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "categories",
		id: "categories",
	});
}
