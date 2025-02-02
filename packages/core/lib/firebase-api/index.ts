export const collections = {
	products: "products",
	profiles: "profiles",
	cart: "cart",
	clients: "clients",
	orders: "orders",
	categories: "categories",
	favorites: "favorites",
	stores: "stores",
	companies: "companies",
	payments: "payments",
} as const;

export const FirestoreApi = {
	getPath: ({
		companyId,
		storeId,
		collectionName,
	}: {
		companyId: string;
		storeId: string;
		collectionName: string;
	}) => {
		return `${companyId}/${storeId}/${collectionName}`;
	},
	getProductsPath: ({ companyId, storeId }: { companyId: string; storeId: string }) => {
		return FirestoreApi.getPath({ companyId, storeId, collectionName: collections.products });
	},
};

export const FirebaseAPI = {
	firestore: FirestoreApi,
};
