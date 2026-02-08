import { TProduct } from "@jsdev_ninja/core";
import algoliasearch from "algoliasearch";

const algolia = algoliasearch("633V4WVLUB", "2f3dbcf0c588a92a1e553020254ddb3a");

export const productsIndex = algolia.initIndex("products");

export class AlgoliaService {

	async queryProducts(query: string): Promise<{ success: boolean; data: TProduct[] | null; error: string | null }> {
		try {
			const result = await productsIndex.search(query);
			return { success: true, data: result.hits as TProduct[], error: null };
		} catch (error: any) {
			return { success: false, data: null, error: error.message };
		}
	}
}
