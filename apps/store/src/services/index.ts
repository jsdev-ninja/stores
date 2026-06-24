import algoliasearch from "algoliasearch/lite";
import { CONFIG } from "src/config";

// Search-only Algolia client — safe to ship in the browser bundle.
// Credentials live in src/config (CONFIG.ALGOLIA). Only ever put a SEARCH-ONLY
// key there; a write-capable key would be readable by anyone who loads the site.
export const AlgoliaClient = algoliasearch(CONFIG.ALGOLIA.APP_ID, CONFIG.ALGOLIA.SEARCH_KEY);
export const productsIndex = AlgoliaClient.initIndex(CONFIG.ALGOLIA.PRODUCTS_INDEX);
