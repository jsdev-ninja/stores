export declare const collections: {
    readonly products: "products";
    readonly profiles: "profiles";
    readonly cart: "cart";
    readonly clients: "clients";
    readonly orders: "orders";
    readonly categories: "categories";
    readonly favorites: "favorites";
    readonly stores: "stores";
    readonly companies: "companies";
    readonly payments: "payments";
};
export declare const FirestoreApi: {
    getPath: ({ companyId, storeId, collectionName, }: {
        companyId: string;
        storeId: string;
        collectionName: string;
    }) => string;
    getProductsPath: ({ companyId, storeId }: {
        companyId: string;
        storeId: string;
    }) => string;
};
export declare const FirebaseAPI: {
    firestore: {
        getPath: ({ companyId, storeId, collectionName, }: {
            companyId: string;
            storeId: string;
            collectionName: string;
        }) => string;
        getProductsPath: ({ companyId, storeId }: {
            companyId: string;
            storeId: string;
        }) => string;
    };
};
//# sourceMappingURL=index.d.ts.map