export declare const systemCollections: {
    readonly stores: "stores";
    readonly companies: "companies";
};
export declare const storeCollections: {
    readonly products: "products";
    readonly profiles: "profiles";
    readonly cart: "cart";
    readonly clients: "clients";
    readonly orders: "orders";
    readonly categories: "categories";
    readonly favorites: "favorites";
    readonly payments: "payments";
};
export declare const FirestoreApi: {
    systemCollections: {
        readonly stores: "stores";
        readonly companies: "companies";
    };
    storeCollections: {
        readonly products: "products";
        readonly profiles: "profiles";
        readonly cart: "cart";
        readonly clients: "clients";
        readonly orders: "orders";
        readonly categories: "categories";
        readonly favorites: "favorites";
        readonly payments: "payments";
    };
    getPath: ({ companyId, storeId, collectionName, id, }: {
        companyId: string;
        storeId: string;
        collectionName: keyof typeof storeCollections;
        id?: string;
    }) => string;
    getDocPath: (collectionName: keyof typeof storeCollections) => string;
};
export declare const FirebaseAPI: {
    firestore: {
        systemCollections: {
            readonly stores: "stores";
            readonly companies: "companies";
        };
        storeCollections: {
            readonly products: "products";
            readonly profiles: "profiles";
            readonly cart: "cart";
            readonly clients: "clients";
            readonly orders: "orders";
            readonly categories: "categories";
            readonly favorites: "favorites";
            readonly payments: "payments";
        };
        getPath: ({ companyId, storeId, collectionName, id, }: {
            companyId: string;
            storeId: string;
            collectionName: keyof typeof storeCollections;
            id?: string;
        }) => string;
        getDocPath: (collectionName: keyof typeof storeCollections) => string;
    };
};
//# sourceMappingURL=index.d.ts.map