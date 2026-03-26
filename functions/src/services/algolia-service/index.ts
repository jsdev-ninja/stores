import { TProduct } from "@jsdev_ninja/core";
import algoliasearch from "algoliasearch";
import { logger } from "firebase-functions/v2";

const algolia = algoliasearch("633V4WVLUB", "2f3dbcf0c588a92a1e553020254ddb3a");

export const productsIndex = algolia.initIndex("products");

export class AlgoliaService {
	private context: { storeId?: string; companyId?: string };
	constructor(context: { storeId?: string; companyId?: string } = {}) {
		this.context = context;
	}

	async queryProducts(query: string): Promise<{ success: boolean; data: TProduct[] | null; error: string | null }> {
		try {
			const { storeId, companyId } = this.context;
			if (!storeId || !companyId) {
				logger.warn("Algolia query skipped: missing context", {
					query,
					storeId,
					companyId,
				});
				return { success: false, data: null, error: "Missing store or company context" };
			}

			logger.info("Algolia query products", {
				query,
				storeId,
				companyId,
			});

			const result = await productsIndex.search(query, {
				filters: `storeId:${storeId} AND companyId:${companyId}`,
			});
			logger.info("Algolia query products result", {
				query,
				storeId,
				companyId,
				hitsCount: result.hits?.length ?? 0,
				productIds: (result.hits ?? []).map((hit: any) => hit.id).slice(0, 10),
			});
			return { success: true, data: result.hits as TProduct[], error: null };
		} catch (error: any) {
			logger.error("Algolia query products failed", {
				query,
				storeId: this.context.storeId,
				companyId: this.context.companyId,
				error,
			});
			return { success: false, data: null, error: error.message };
		}
	}
}
