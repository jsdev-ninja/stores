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
		collectionName: keyof typeof collections;
	}) => {
		return `${companyId}/${storeId}/${collectionName}`;
	},
};

export const FirebaseAPI = {
	firestore: FirestoreApi,
};
