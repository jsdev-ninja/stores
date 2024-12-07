import { z } from "zod";
export declare const OrderSchema: z.ZodObject<{
    type: z.ZodLiteral<"Order">;
    id: z.ZodString;
    companyId: z.ZodString;
    storeId: z.ZodString;
    userId: z.ZodString;
    status: z.ZodEnum<["pending", "processing", "delivered", "canceled", "completed", "refunded"]>;
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
                    lang: z.ZodString;
                    value: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    value: string;
                    lang: string;
                }, {
                    value: string;
                    lang: string;
                }>, "many">;
                description: z.ZodArray<z.ZodObject<{
                    lang: z.ZodString;
                    value: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    value: string;
                    lang: string;
                }, {
                    value: string;
                    lang: string;
                }>, "many">;
                isPublished: z.ZodBoolean;
                vat: z.ZodBoolean;
                priceType: z.ZodObject<{
                    type: z.ZodEnum<["unit", "kg", "gram", "liter", "ml"]>;
                    value: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    type: "unit" | "kg" | "gram" | "liter" | "ml";
                    value: number;
                }, {
                    type: "unit" | "kg" | "gram" | "liter" | "ml";
                    value: number;
                }>;
                price: z.ZodNumber;
                purchasePrice: z.ZodOptional<z.ZodNumber>;
                profitPercentage: z.ZodOptional<z.ZodNumber>;
                currency: z.ZodLiteral<"ILS">;
                discount: z.ZodObject<{
                    type: z.ZodEnum<["number", "percent", "none"]>;
                    value: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    type: "number" | "percent" | "none";
                    value: number;
                }, {
                    type: "number" | "percent" | "none";
                    value: number;
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
                    lang: z.ZodString;
                    value: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    value: string;
                    lang: string;
                }, {
                    value: string;
                    lang: string;
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
                        lang: string;
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
                            lang: string;
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
                        lang: string;
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
                            lang: string;
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
                    lang: string;
                }[];
                description: {
                    value: string;
                    lang: string;
                }[];
                isPublished: boolean;
                vat: boolean;
                priceType: {
                    type: "unit" | "kg" | "gram" | "liter" | "ml";
                    value: number;
                };
                price: number;
                currency: "ILS";
                discount: {
                    type: "number" | "percent" | "none";
                    value: number;
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
                    lang: string;
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
                        lang: string;
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
                            lang: string;
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
                    lang: string;
                }[];
                description: {
                    value: string;
                    lang: string;
                }[];
                isPublished: boolean;
                vat: boolean;
                priceType: {
                    type: "unit" | "kg" | "gram" | "liter" | "ml";
                    value: number;
                };
                price: number;
                currency: "ILS";
                discount: {
                    type: "number" | "percent" | "none";
                    value: number;
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
                    lang: string;
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
                        lang: string;
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
                            lang: string;
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
                    lang: string;
                }[];
                description: {
                    value: string;
                    lang: string;
                }[];
                isPublished: boolean;
                vat: boolean;
                priceType: {
                    type: "unit" | "kg" | "gram" | "liter" | "ml";
                    value: number;
                };
                price: number;
                currency: "ILS";
                discount: {
                    type: "number" | "percent" | "none";
                    value: number;
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
                    lang: string;
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
                        lang: string;
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
                            lang: string;
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
                    lang: string;
                }[];
                description: {
                    value: string;
                    lang: string;
                }[];
                isPublished: boolean;
                vat: boolean;
                priceType: {
                    type: "unit" | "kg" | "gram" | "liter" | "ml";
                    value: number;
                };
                price: number;
                currency: "ILS";
                discount: {
                    type: "number" | "percent" | "none";
                    value: number;
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
                    lang: string;
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
                        lang: string;
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
                            lang: string;
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
        cartTotal: z.ZodNumber;
        cartDiscount: z.ZodNumber;
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
                    lang: string;
                }[];
                description: {
                    value: string;
                    lang: string;
                }[];
                isPublished: boolean;
                vat: boolean;
                priceType: {
                    type: "unit" | "kg" | "gram" | "liter" | "ml";
                    value: number;
                };
                price: number;
                currency: "ILS";
                discount: {
                    type: "number" | "percent" | "none";
                    value: number;
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
                    lang: string;
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
                        lang: string;
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
                            lang: string;
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
        cartTotal: number;
        cartDiscount: number;
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
                    lang: string;
                }[];
                description: {
                    value: string;
                    lang: string;
                }[];
                isPublished: boolean;
                vat: boolean;
                priceType: {
                    type: "unit" | "kg" | "gram" | "liter" | "ml";
                    value: number;
                };
                price: number;
                currency: "ILS";
                discount: {
                    type: "number" | "percent" | "none";
                    value: number;
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
                    lang: string;
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
                        lang: string;
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
                            lang: string;
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
        cartTotal: number;
        cartDiscount: number;
        cartVat: number;
    }>;
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
}, "strip", z.ZodTypeAny, {
    type: "Order";
    status: "pending" | "processing" | "delivered" | "canceled" | "completed" | "refunded";
    date: number;
    id: string;
    companyId: string;
    storeId: string;
    address: {
        country: string;
        city: string;
        street: string;
        streetNumber: string;
        floor: string;
        apartmentEnterNumber: string;
        apartmentNumber: string;
    };
    userId: string;
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
                    lang: string;
                }[];
                description: {
                    value: string;
                    lang: string;
                }[];
                isPublished: boolean;
                vat: boolean;
                priceType: {
                    type: "unit" | "kg" | "gram" | "liter" | "ml";
                    value: number;
                };
                price: number;
                currency: "ILS";
                discount: {
                    type: "number" | "percent" | "none";
                    value: number;
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
                    lang: string;
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
                        lang: string;
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
                            lang: string;
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
        cartTotal: number;
        cartDiscount: number;
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
    deliveryDate?: number | undefined;
}, {
    type: "Order";
    status: "pending" | "processing" | "delivered" | "canceled" | "completed" | "refunded";
    date: number;
    id: string;
    companyId: string;
    storeId: string;
    address: {
        country: string;
        city: string;
        street: string;
        streetNumber: string;
        floor: string;
        apartmentEnterNumber: string;
        apartmentNumber: string;
    };
    userId: string;
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
                    lang: string;
                }[];
                description: {
                    value: string;
                    lang: string;
                }[];
                isPublished: boolean;
                vat: boolean;
                priceType: {
                    type: "unit" | "kg" | "gram" | "liter" | "ml";
                    value: number;
                };
                price: number;
                currency: "ILS";
                discount: {
                    type: "number" | "percent" | "none";
                    value: number;
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
                    lang: string;
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
                        lang: string;
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
                            lang: string;
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
        cartTotal: number;
        cartDiscount: number;
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
    deliveryDate?: number | undefined;
}>;
export type TOrder = z.infer<typeof OrderSchema>;
//# sourceMappingURL=Order.d.ts.map