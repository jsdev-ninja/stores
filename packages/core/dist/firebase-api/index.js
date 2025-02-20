export const systemCollections = {
    stores: "stores",
    companies: "companies",
};
export const storeCollections = {
    products: "products",
    profiles: "profiles",
    cart: "cart",
    clients: "clients",
    orders: "orders",
    categories: "categories",
    favorites: "favorites",
    payments: "payments",
};
export const FirestoreApi = {
    systemCollections,
    storeCollections,
    // for client
    getPath: ({ companyId, storeId, collectionName, id, }) => {
        return `${companyId}/${storeId}/${collectionName}${id ? `/${id}` : ""}`;
    },
    // for backend
    getDocPath: (collectionName) => {
        return `{companyId}/{storeId}/${collectionName}/{id}`;
    },
};
export const FirebaseAPI = {
    firestore: FirestoreApi,
};
