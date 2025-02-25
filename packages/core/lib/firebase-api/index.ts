export const systemCollections = {
	stores: "STORES",
	companies: "COMPANIES",
} as const;

export const storeCollections = {
	products: "products",
	profiles: "profiles",
	cart: "cart",
	clients: "clients",
	orders: "orders",
	categories: "categories",
	favorites: "favorites",
	payments: "payments",
	settings: "settings",
} as const;

export const FirestoreApi = {
	systemCollections,
	storeCollections,
	// for client
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
	// for backend
	getDocPath: (collectionName: keyof typeof storeCollections) => {
		return `{companyId}/{storeId}/${collectionName}/{id}`;
	},
};

export const FirebaseAPI = {
	firestore: FirestoreApi,
};
