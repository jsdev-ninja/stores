export const systemCollections = {
	stores: "STORES",
	companies: "COMPANIES",
} as const;

export const storeCollections = {
	products: "products",
	"favorite-products": "favorite-products",
	profiles: "profiles",
	cart: "cart",
	clients: "clients",
	orders: "orders",
	categories: "categories",
	payments: "payments",
	settings: "settings",
	discounts: "discounts",
	organizations: "organizations",
	organizationGroups: "organizationGroups", // todo remove
	invoices: "invoices",
	suppliers: "suppliers",
	supplierInvoices: "supplierInvoices",
} as const;

export const FirestoreApi = {
	systemCollections,
	storeCollections,
	// for client and server
	getPath: ({
		companyId,
		storeId,
		collectionName,
		id,
	}: {
		companyId: string;
		storeId: string;
		collectionName: keyof typeof storeCollections;
		id?: string;
	}) => {
		return `${companyId}/${storeId}/${collectionName}${id ? `/${id}` : ""}`;
	},
	// for firestore events
	getDocPath: (collectionName: keyof typeof storeCollections) => {
		return `{companyId}/{storeId}/${collectionName}/{id}`;
	},
};

export const FirebaseAPI = {
	firestore: FirestoreApi,
};
