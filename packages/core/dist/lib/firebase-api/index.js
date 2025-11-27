export const systemCollections = {
    stores: "STORES",
    companies: "COMPANIES",
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
    settings: "settings",
    discounts: "discounts",
    organizations: "organizations",
    invoices: "invoices",
};
export const FirestoreApi = {
    systemCollections,
    storeCollections,
    // for client and server
    getPath: ({ companyId, storeId, collectionName, id, }) => {
        return `${companyId}/${storeId}/${collectionName}${id ? `/${id}` : ""}`;
    },
    // for firestore events
    getDocPath: (collectionName) => {
        return `{companyId}/{storeId}/${collectionName}/{id}`;
    },
};
export const FirebaseAPI = {
    firestore: FirestoreApi,
};
