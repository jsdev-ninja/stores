export const CONFIG = {
	MODE: import.meta.env.MODE,
	PROD: import.meta.env.PROD,
	DEV: import.meta.env.DEV,
	BASE_URL: import.meta.env.BASE_URL,
	VERSION: import.meta.env.VITE_STORE_VERSION,
	VAT: 18,
	ALGOLIA: {
		APP_ID: "633V4WVLUB",
		// Search-only key — safe to ship in the browser bundle (NOT a secret).
		// ⚠️ TODO(security): this value is still the OLD write-capable key. Create a
		// "Search-Only API Key" in the Algolia dashboard, paste it here, then revoke
		// the old key. Until that swap, the products index is writable from the browser.
		SEARCH_KEY: "2f3dbcf0c588a92a1e553020254ddb3a",
		PRODUCTS_INDEX: "products",
	},
};

export const LOCALES_MAP = {
	he: "he-IL",
};
