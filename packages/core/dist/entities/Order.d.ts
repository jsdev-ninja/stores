import { z } from "zod";
export declare const OrderSchema: z.ZodObject<{
    type: z.ZodLiteral<"Order">;
    id: z.ZodString;
    companyId: z.ZodString;
    storeId: z.ZodString;
    userId: z.ZodString;
    status: z.ZodEnum<["pending", "processing", "in_delivery", "delivered", "canceled", "completed", "refunded"]>;
    paymentStatus: z.ZodEnum<["pending", "completed", "failed", "refunded"]>;
    cart: z.ZodObject<{
        id: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
            product: z.ZodObject<{
                type: z.ZodLiteral<"Product">;
                storeId: z.ZodString;
                companyId: z.ZodString;
                id: z.ZodString;
                objectID: z.ZodString;
                sku: z.ZodString;
                name: z.ZodArray<z.ZodObject<{
                    lang: z.ZodEnum<["he"]>;
                    value: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    value: string;
                    lang: "he";
                }, {
                    value: string;
                    lang: "he";
                }>, "many">;
                description: z.ZodArray<z.ZodObject<{
                    lang: z.ZodEnum<["he"]>;
                    value: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    value: string;
                    lang: "he";
                }, {
                    value: string;
                    lang: "he";
                }>, "many">;
                isPublished: z.ZodBoolean;
                vat: z.ZodBoolean;
                priceType: z.ZodObject<{
                    type: z.ZodEnum<["unit", "kg", "gram", "liter", "ml"]>;
                    value: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    value: number;
                    type: "unit" | "kg" | "gram" | "liter" | "ml";
                }, {
                    value: number;
                    type: "unit" | "kg" | "gram" | "liter" | "ml";
                }>;
                price: z.ZodNumber;
                purchasePrice: z.ZodOptional<z.ZodNumber>;
                profitPercentage: z.ZodOptional<z.ZodNumber>;
                currency: z.ZodLiteral<"ILS">;
                discount: z.ZodObject<{
                    type: z.ZodEnum<["number", "percent", "none"]>;
                    value: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    value: number;
                    type: "number" | "percent" | "none";
                }, {
                    value: number;
                    type: "number" | "percent" | "none";
                }>;
                weight: z.ZodObject<{
                    value: z.ZodNumber;
                    unit: z.ZodEnum<["kg", "gram", "none"]>;
                }, "strip", z.ZodTypeAny, {
                    value: number;
                    unit: "kg" | "gram" | "none";
                }, {
                    value: number;
                    unit: "kg" | "gram" | "none";
                }>;
                volume: z.ZodObject<{
                    value: z.ZodNumber;
                    unit: z.ZodEnum<["liter", "ml", "none"]>;
                }, "strip", z.ZodTypeAny, {
                    value: number;
                    unit: "liter" | "ml" | "none";
                }, {
                    value: number;
                    unit: "liter" | "ml" | "none";
                }>;
                images: z.ZodArray<z.ZodObject<{
                    url: z.ZodString;
                    id: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    url: string;
                }, {
                    id: string;
                    url: string;
                }>, "many">;
                manufacturer: z.ZodString;
                brand: z.ZodString;
                importer: z.ZodString;
                supplier: z.ZodString;
                ingredients: z.ZodArray<z.ZodObject<{
                    lang: z.ZodEnum<["he"]>;
                    value: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    value: string;
                    lang: "he";
                }, {
                    value: string;
                    lang: "he";
                }>, "many">;
                created_at: z.ZodNumber;
                updated_at: z.ZodNumber;
                categoryList: z.ZodArray<z.ZodType<{
                    id: string;
                    companyId: string;
                    storeId: string;
                    tag: string;
                    locales: {
                        value: string;
                        lang: "he";
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                } & {
                    children: ({
                        id: string;
                        companyId: string;
                        storeId: string;
                        tag: string;
                        locales: {
                            value: string;
                            lang: "he";
                        }[];
                        depth: number;
                        parentId?: string | null | undefined;
                    } & /*elided*/ any)[];
                }, z.ZodTypeDef, {
                    id: string;
                    companyId: string;
                    storeId: string;
                    tag: string;
                    locales: {
                        value: string;
                        lang: "he";
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                } & {
                    children: ({
                        id: string;
                        companyId: string;
                        storeId: string;
                        tag: string;
                        locales: {
                            value: string;
                            lang: "he";
                        }[];
                        depth: number;
                        parentId?: string | null | undefined;
                    } & /*elided*/ any)[];
                }>, "many">;
                categories: z.ZodObject<{
                    lvl0: z.ZodArray<z.ZodString, "many">;
                    lvl1: z.ZodArray<z.ZodString, "many">;
                    lvl2: z.ZodArray<z.ZodString, "many">;
                    lvl3: z.ZodArray<z.ZodString, "many">;
                    lvl4: z.ZodArray<z.ZodString, "many">;
                }, "strip", z.ZodTypeAny, {
                    lvl0: string[];
                    lvl1: string[];
                    lvl2: string[];
                    lvl3: string[];
                    lvl4: string[];
                }, {
                    lvl0: string[];
                    lvl1: string[];
                    lvl2: string[];
                    lvl3: string[];
                    lvl4: string[];
                }>;
                categoryNames: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                type: "Product";
                id: string;
                companyId: string;
                storeId: string;
                objectID: string;
                sku: string;
                name: {
                    value: string;
                    lang: "he";
                }[];
                description: {
                    value: string;
                    lang: "he";
                }[];
                isPublished: boolean;
                vat: boolean;
                priceType: {
                    value: number;
                    type: "unit" | "kg" | "gram" | "liter" | "ml";
                };
                price: number;
                currency: "ILS";
                discount: {
                    value: number;
                    type: "number" | "percent" | "none";
                };
                weight: {
                    value: number;
                    unit: "kg" | "gram" | "none";
                };
                volume: {
                    value: number;
                    unit: "liter" | "ml" | "none";
                };
                images: {
                    id: string;
                    url: string;
                }[];
                manufacturer: string;
                brand: string;
                importer: string;
                supplier: string;
                ingredients: {
                    value: string;
                    lang: "he";
                }[];
                created_at: number;
                updated_at: number;
                categoryList: ({
                    id: string;
                    companyId: string;
                    storeId: string;
                    tag: string;
                    locales: {
                        value: string;
                        lang: "he";
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                } & {
                    children: ({
                        id: string;
                        companyId: string;
                        storeId: string;
                        tag: string;
                        locales: {
                            value: string;
                            lang: "he";
                        }[];
                        depth: number;
                        parentId?: string | null | undefined;
                    } & /*elided*/ any)[];
                })[];
                categories: {
                    lvl0: string[];
                    lvl1: string[];
                    lvl2: string[];
                    lvl3: string[];
                    lvl4: string[];
                };
                categoryNames: string[];
                purchasePrice?: number | undefined;
                profitPercentage?: number | undefined;
            }, {
                type: "Product";
                id: string;
                companyId: string;
                storeId: string;
                objectID: string;
                sku: string;
                name: {
                    value: string;
                    lang: "he";
                }[];
                description: {
                    value: string;
                    lang: "he";
                }[];
                isPublished: boolean;
                vat: boolean;
                priceType: {
                    value: number;
                    type: "unit" | "kg" | "gram" | "liter" | "ml";
                };
                price: number;
                currency: "ILS";
                discount: {
                    value: number;
                    type: "number" | "percent" | "none";
                };
                weight: {
                    value: number;
                    unit: "kg" | "gram" | "none";
                };
                volume: {
                    value: number;
                    unit: "liter" | "ml" | "none";
                };
                images: {
                    id: string;
                    url: string;
                }[];
                manufacturer: string;
                brand: string;
                importer: string;
                supplier: string;
                ingredients: {
                    value: string;
                    lang: "he";
                }[];
                created_at: number;
                updated_at: number;
                categoryList: ({
                    id: string;
                    companyId: string;
                    storeId: string;
                    tag: string;
                    locales: {
                        value: string;
                        lang: "he";
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                } & {
                    children: ({
                        id: string;
                        companyId: string;
                        storeId: string;
                        tag: string;
                        locales: {
                            value: string;
                            lang: "he";
                        }[];
                        depth: number;
                        parentId?: string | null | undefined;
                    } & /*elided*/ any)[];
                })[];
                categories: {
                    lvl0: string[];
                    lvl1: string[];
                    lvl2: string[];
                    lvl3: string[];
                    lvl4: string[];
                };
                categoryNames: string[];
                purchasePrice?: number | undefined;
                profitPercentage?: number | undefined;
            }>;
            amount: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            product: {
                type: "Product";
                id: string;
                companyId: string;
                storeId: string;
                objectID: string;
                sku: string;
                name: {
                    value: string;
                    lang: "he";
                }[];
                description: {
                    value: string;
                    lang: "he";
                }[];
                isPublished: boolean;
                vat: boolean;
                priceType: {
                    value: number;
                    type: "unit" | "kg" | "gram" | "liter" | "ml";
                };
                price: number;
                currency: "ILS";
                discount: {
                    value: number;
                    type: "number" | "percent" | "none";
                };
                weight: {
                    value: number;
                    unit: "kg" | "gram" | "none";
                };
                volume: {
                    value: number;
                    unit: "liter" | "ml" | "none";
                };
                images: {
                    id: string;
                    url: string;
                }[];
                manufacturer: string;
                brand: string;
                importer: string;
                supplier: string;
                ingredients: {
                    value: string;
                    lang: "he";
                }[];
                created_at: number;
                updated_at: number;
                categoryList: ({
                    id: string;
                    companyId: string;
                    storeId: string;
                    tag: string;
                    locales: {
                        value: string;
                        lang: "he";
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                } & {
                    children: ({
                        id: string;
                        companyId: string;
                        storeId: string;
                        tag: string;
                        locales: {
                            value: string;
                            lang: "he";
                        }[];
                        depth: number;
                        parentId?: string | null | undefined;
                    } & /*elided*/ any)[];
                })[];
                categories: {
                    lvl0: string[];
                    lvl1: string[];
                    lvl2: string[];
                    lvl3: string[];
                    lvl4: string[];
                };
                categoryNames: string[];
                purchasePrice?: number | undefined;
                profitPercentage?: number | undefined;
            };
            amount: number;
        }, {
            product: {
                type: "Product";
                id: string;
                companyId: string;
                storeId: string;
                objectID: string;
                sku: string;
                name: {
                    value: string;
                    lang: "he";
                }[];
                description: {
                    value: string;
                    lang: "he";
                }[];
                isPublished: boolean;
                vat: boolean;
                priceType: {
                    value: number;
                    type: "unit" | "kg" | "gram" | "liter" | "ml";
                };
                price: number;
                currency: "ILS";
                discount: {
                    value: number;
                    type: "number" | "percent" | "none";
                };
                weight: {
                    value: number;
                    unit: "kg" | "gram" | "none";
                };
                volume: {
                    value: number;
                    unit: "liter" | "ml" | "none";
                };
                images: {
                    id: string;
                    url: string;
                }[];
                manufacturer: string;
                brand: string;
                importer: string;
                supplier: string;
                ingredients: {
                    value: string;
                    lang: "he";
                }[];
                created_at: number;
                updated_at: number;
                categoryList: ({
                    id: string;
                    companyId: string;
                    storeId: string;
                    tag: string;
                    locales: {
                        value: string;
                        lang: "he";
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                } & {
                    children: ({
                        id: string;
                        companyId: string;
                        storeId: string;
                        tag: string;
                        locales: {
                            value: string;
                            lang: "he";
                        }[];
                        depth: number;
                        parentId?: string | null | undefined;
                    } & /*elided*/ any)[];
                })[];
                categories: {
                    lvl0: string[];
                    lvl1: string[];
                    lvl2: string[];
                    lvl3: string[];
                    lvl4: string[];
                };
                categoryNames: string[];
                purchasePrice?: number | undefined;
                profitPercentage?: number | undefined;
            };
            amount: number;
        }>, "many">;
        cartDiscount: z.ZodNumber;
        cartTotal: z.ZodNumber;
        cartVat: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        items: {
            product: {
                type: "Product";
                id: string;
                companyId: string;
                storeId: string;
                objectID: string;
                sku: string;
                name: {
                    value: string;
                    lang: "he";
                }[];
                description: {
                    value: string;
                    lang: "he";
                }[];
                isPublished: boolean;
                vat: boolean;
                priceType: {
                    value: number;
                    type: "unit" | "kg" | "gram" | "liter" | "ml";
                };
                price: number;
                currency: "ILS";
                discount: {
                    value: number;
                    type: "number" | "percent" | "none";
                };
                weight: {
                    value: number;
                    unit: "kg" | "gram" | "none";
                };
                volume: {
                    value: number;
                    unit: "liter" | "ml" | "none";
                };
                images: {
                    id: string;
                    url: string;
                }[];
                manufacturer: string;
                brand: string;
                importer: string;
                supplier: string;
                ingredients: {
                    value: string;
                    lang: "he";
                }[];
                created_at: number;
                updated_at: number;
                categoryList: ({
                    id: string;
                    companyId: string;
                    storeId: string;
                    tag: string;
                    locales: {
                        value: string;
                        lang: "he";
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                } & {
                    children: ({
                        id: string;
                        companyId: string;
                        storeId: string;
                        tag: string;
                        locales: {
                            value: string;
                            lang: "he";
                        }[];
                        depth: number;
                        parentId?: string | null | undefined;
                    } & /*elided*/ any)[];
                })[];
                categories: {
                    lvl0: string[];
                    lvl1: string[];
                    lvl2: string[];
                    lvl3: string[];
                    lvl4: string[];
                };
                categoryNames: string[];
                purchasePrice?: number | undefined;
                profitPercentage?: number | undefined;
            };
            amount: number;
        }[];
        cartDiscount: number;
        cartTotal: number;
        cartVat: number;
    }, {
        id: string;
        items: {
            product: {
                type: "Product";
                id: string;
                companyId: string;
                storeId: string;
                objectID: string;
                sku: string;
                name: {
                    value: string;
                    lang: "he";
                }[];
                description: {
                    value: string;
                    lang: "he";
                }[];
                isPublished: boolean;
                vat: boolean;
                priceType: {
                    value: number;
                    type: "unit" | "kg" | "gram" | "liter" | "ml";
                };
                price: number;
                currency: "ILS";
                discount: {
                    value: number;
                    type: "number" | "percent" | "none";
                };
                weight: {
                    value: number;
                    unit: "kg" | "gram" | "none";
                };
                volume: {
                    value: number;
                    unit: "liter" | "ml" | "none";
                };
                images: {
                    id: string;
                    url: string;
                }[];
                manufacturer: string;
                brand: string;
                importer: string;
                supplier: string;
                ingredients: {
                    value: string;
                    lang: "he";
                }[];
                created_at: number;
                updated_at: number;
                categoryList: ({
                    id: string;
                    companyId: string;
                    storeId: string;
                    tag: string;
                    locales: {
                        value: string;
                        lang: "he";
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                } & {
                    children: ({
                        id: string;
                        companyId: string;
                        storeId: string;
                        tag: string;
                        locales: {
                            value: string;
                            lang: "he";
                        }[];
                        depth: number;
                        parentId?: string | null | undefined;
                    } & /*elided*/ any)[];
                })[];
                categories: {
                    lvl0: string[];
                    lvl1: string[];
                    lvl2: string[];
                    lvl3: string[];
                    lvl4: string[];
                };
                categoryNames: string[];
                purchasePrice?: number | undefined;
                profitPercentage?: number | undefined;
            };
            amount: number;
        }[];
        cartDiscount: number;
        cartTotal: number;
        cartVat: number;
    }>;
    originalAmount: z.ZodOptional<z.ZodNumber>;
    actualAmount: z.ZodOptional<z.ZodNumber>;
    date: z.ZodNumber;
    deliveryDate: z.ZodOptional<z.ZodNumber>;
    client: z.ZodObject<{
        type: z.ZodLiteral<"Profile">;
        id: z.ZodString;
        companyId: z.ZodString;
        storeId: z.ZodString;
        tenantId: z.ZodString;
        clientType: z.ZodEnum<["user", "company"]>;
        displayName: z.ZodString;
        email: z.ZodString;
        phoneNumber: z.ZodObject<{
            code: z.ZodString;
            number: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            number: string;
            code: string;
        }, {
            number: string;
            code: string;
        }>;
        address: z.ZodObject<{
            country: z.ZodString;
            city: z.ZodString;
            street: z.ZodString;
            streetNumber: z.ZodString;
            floor: z.ZodString;
            apartmentEnterNumber: z.ZodString;
            apartmentNumber: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            country: string;
            city: string;
            street: string;
            streetNumber: string;
            floor: string;
            apartmentEnterNumber: string;
            apartmentNumber: string;
        }, {
            country: string;
            city: string;
            street: string;
            streetNumber: string;
            floor: string;
            apartmentEnterNumber: string;
            apartmentNumber: string;
        }>;
        isAnonymous: z.ZodBoolean;
        createdDate: z.ZodNumber;
        lastActivityDate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "Profile";
        id: string;
        companyId: string;
        storeId: string;
        tenantId: string;
        clientType: "user" | "company";
        displayName: string;
        email: string;
        phoneNumber: {
            number: string;
            code: string;
        };
        address: {
            country: string;
            city: string;
            street: string;
            streetNumber: string;
            floor: string;
            apartmentEnterNumber: string;
            apartmentNumber: string;
        };
        isAnonymous: boolean;
        createdDate: number;
        lastActivityDate: number;
    }, {
        type: "Profile";
        id: string;
        companyId: string;
        storeId: string;
        tenantId: string;
        clientType: "user" | "company";
        displayName: string;
        email: string;
        phoneNumber: {
            number: string;
            code: string;
        };
        address: {
            country: string;
            city: string;
            street: string;
            streetNumber: string;
            floor: string;
            apartmentEnterNumber: string;
            apartmentNumber: string;
        };
        isAnonymous: boolean;
        createdDate: number;
        lastActivityDate: number;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "Order";
    status: "completed" | "pending" | "processing" | "in_delivery" | "delivered" | "canceled" | "refunded";
    date: number;
    id: string;
    companyId: string;
    storeId: string;
    userId: string;
    paymentStatus: "completed" | "pending" | "refunded" | "failed";
    cart: {
        id: string;
        items: {
            product: {
                type: "Product";
                id: string;
                companyId: string;
                storeId: string;
                objectID: string;
                sku: string;
                name: {
                    value: string;
                    lang: "he";
                }[];
                description: {
                    value: string;
                    lang: "he";
                }[];
                isPublished: boolean;
                vat: boolean;
                priceType: {
                    value: number;
                    type: "unit" | "kg" | "gram" | "liter" | "ml";
                };
                price: number;
                currency: "ILS";
                discount: {
                    value: number;
                    type: "number" | "percent" | "none";
                };
                weight: {
                    value: number;
                    unit: "kg" | "gram" | "none";
                };
                volume: {
                    value: number;
                    unit: "liter" | "ml" | "none";
                };
                images: {
                    id: string;
                    url: string;
                }[];
                manufacturer: string;
                brand: string;
                importer: string;
                supplier: string;
                ingredients: {
                    value: string;
                    lang: "he";
                }[];
                created_at: number;
                updated_at: number;
                categoryList: ({
                    id: string;
                    companyId: string;
                    storeId: string;
                    tag: string;
                    locales: {
                        value: string;
                        lang: "he";
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                } & {
                    children: ({
                        id: string;
                        companyId: string;
                        storeId: string;
                        tag: string;
                        locales: {
                            value: string;
                            lang: "he";
                        }[];
                        depth: number;
                        parentId?: string | null | undefined;
                    } & /*elided*/ any)[];
                })[];
                categories: {
                    lvl0: string[];
                    lvl1: string[];
                    lvl2: string[];
                    lvl3: string[];
                    lvl4: string[];
                };
                categoryNames: string[];
                purchasePrice?: number | undefined;
                profitPercentage?: number | undefined;
            };
            amount: number;
        }[];
        cartDiscount: number;
        cartTotal: number;
        cartVat: number;
    };
    client: {
        type: "Profile";
        id: string;
        companyId: string;
        storeId: string;
        tenantId: string;
        clientType: "user" | "company";
        displayName: string;
        email: string;
        phoneNumber: {
            number: string;
            code: string;
        };
        address: {
            country: string;
            city: string;
            street: string;
            streetNumber: string;
            floor: string;
            apartmentEnterNumber: string;
            apartmentNumber: string;
        };
        isAnonymous: boolean;
        createdDate: number;
        lastActivityDate: number;
    };
    originalAmount?: number | undefined;
    actualAmount?: number | undefined;
    deliveryDate?: number | undefined;
}, {
    type: "Order";
    status: "completed" | "pending" | "processing" | "in_delivery" | "delivered" | "canceled" | "refunded";
    date: number;
    id: string;
    companyId: string;
    storeId: string;
    userId: string;
    paymentStatus: "completed" | "pending" | "refunded" | "failed";
    cart: {
        id: string;
        items: {
            product: {
                type: "Product";
                id: string;
                companyId: string;
                storeId: string;
                objectID: string;
                sku: string;
                name: {
                    value: string;
                    lang: "he";
                }[];
                description: {
                    value: string;
                    lang: "he";
                }[];
                isPublished: boolean;
                vat: boolean;
                priceType: {
                    value: number;
                    type: "unit" | "kg" | "gram" | "liter" | "ml";
                };
                price: number;
                currency: "ILS";
                discount: {
                    value: number;
                    type: "number" | "percent" | "none";
                };
                weight: {
                    value: number;
                    unit: "kg" | "gram" | "none";
                };
                volume: {
                    value: number;
                    unit: "liter" | "ml" | "none";
                };
                images: {
                    id: string;
                    url: string;
                }[];
                manufacturer: string;
                brand: string;
                importer: string;
                supplier: string;
                ingredients: {
                    value: string;
                    lang: "he";
                }[];
                created_at: number;
                updated_at: number;
                categoryList: ({
                    id: string;
                    companyId: string;
                    storeId: string;
                    tag: string;
                    locales: {
                        value: string;
                        lang: "he";
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                } & {
                    children: ({
                        id: string;
                        companyId: string;
                        storeId: string;
                        tag: string;
                        locales: {
                            value: string;
                            lang: "he";
                        }[];
                        depth: number;
                        parentId?: string | null | undefined;
                    } & /*elided*/ any)[];
                })[];
                categories: {
                    lvl0: string[];
                    lvl1: string[];
                    lvl2: string[];
                    lvl3: string[];
                    lvl4: string[];
                };
                categoryNames: string[];
                purchasePrice?: number | undefined;
                profitPercentage?: number | undefined;
            };
            amount: number;
        }[];
        cartDiscount: number;
        cartTotal: number;
        cartVat: number;
    };
    client: {
        type: "Profile";
        id: string;
        companyId: string;
        storeId: string;
        tenantId: string;
        clientType: "user" | "company";
        displayName: string;
        email: string;
        phoneNumber: {
            number: string;
            code: string;
        };
        address: {
            country: string;
            city: string;
            street: string;
            streetNumber: string;
            floor: string;
            apartmentEnterNumber: string;
            apartmentNumber: string;
        };
        isAnonymous: boolean;
        createdDate: number;
        lastActivityDate: number;
    };
    originalAmount?: number | undefined;
    actualAmount?: number | undefined;
    deliveryDate?: number | undefined;
}>;
export type TOrder = z.infer<typeof OrderSchema>;
//# sourceMappingURL=Order.d.ts.map