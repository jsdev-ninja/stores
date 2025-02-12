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
};
export const FirestoreApi = {
    getPath: ({ companyId, storeId, collectionName, }) => {
        return `${companyId}/${storeId}/${collectionName}`;
    },
    getProductsPath: ({ companyId, storeId }) => {
        return FirestoreApi.getPath({ companyId, storeId, collectionName: collections.products });
    },
};
export const FirebaseAPI = {
    firestore: FirestoreApi,
};
