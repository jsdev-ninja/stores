import algoliasearch from "algoliasearch";

const algolia = algoliasearch("633V4WVLUB", "2f3dbcf0c588a92a1e553020254ddb3a");
const index = algolia.initIndex("products");

export const searchSync = {
	upsert: (product: { id: string; [k: string]: unknown }) =>
		index.saveObject({ objectID: product.id, ...product }),
	remove: (productId: string) => index.deleteObject(productId),
};
