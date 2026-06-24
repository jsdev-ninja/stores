import { productsIndex } from "../../../services/algolia-service";

// Reuses the single shared Algolia client owned by services/algolia-service —
// no separate client/key here. (Key migration to env happens in that module.)
export const searchSync = {
	upsert: (product: { id: string; [k: string]: unknown }) =>
		productsIndex.saveObject({ objectID: product.id, ...product }),
	remove: (productId: string) => productsIndex.deleteObject(productId),
};
