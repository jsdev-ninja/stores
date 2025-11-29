import { z } from "zod";
export declare const OrderSchema: z.ZodObject<{
    type: z.ZodLiteral<"Order">;
    id: z.ZodString;
    companyId: z.ZodString;
    storeId: z.ZodString;
    userId: z.ZodString;
    status: z.ZodEnum<["draft", "pending", "processing", "in_delivery", "delivered", "cancelled", "completed", "refunded"]>;
    paymentType: z.ZodOptional<z.ZodEnum<["internal", "external"]>>;
    paymentStatus: z.ZodEnum<["pending", "pending_j5", "external", "completed", "failed", "refunded"]>;
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
                isDiscountable: z.ZodOptional<z.ZodBoolean>;
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
                    url: string;
                    id: string;
                }, {
                    url: string;
                    id: string;
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
                categoryIds: z.ZodArray<z.ZodString, "many">;
                categoryList: z.ZodOptional<z.ZodArray<z.ZodType<{
                    id: string;
                    companyId: string;
                    storeId: string;
                    locales: {
                        value: string;
                        lang: "he";
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                    tag?: string | undefined;
                } & {
                    children: ({
                        id: string;
                        companyId: string;
                        storeId: string;
                        locales: {
                            value: string;
                            lang: "he";
                        }[];
                        depth: number;
                        parentId?: string | null | undefined;
                        tag?: string | undefined;
                    } & /*elided*/ any)[];
                }, z.ZodTypeDef, {
                    id: string;
                    companyId: string;
                    storeId: string;
                    locales: {
                        value: string;
                        lang: "he";
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                    tag?: string | undefined;
                } & {
                    children: ({
                        id: string;
                        companyId: string;
                        storeId: string;
                        locales: {
                            value: string;
                            lang: "he";
                        }[];
                        depth: number;
                        parentId?: string | null | undefined;
                        tag?: string | undefined;
                    } & /*elided*/ any)[];
                }>, "many">>;
                categories: z.ZodOptional<z.ZodObject<{
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
                }>>;
                categoryNames: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
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
                    url: string;
                    id: string;
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
                categoryIds: string[];
                purchasePrice?: number | undefined;
                profitPercentage?: number | undefined;
                isDiscountable?: boolean | undefined;
                categoryList?: ({
                    id: string;
                    companyId: string;
                    storeId: string;
                    locales: {
                        value: string;
                        lang: "he";
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                    tag?: string | undefined;
                } & {
                    children: ({
                        id: string;
                        companyId: string;
                        storeId: string;
                        locales: {
                            value: string;
                            lang: "he";
                        }[];
                        depth: number;
                        parentId?: string | null | undefined;
                        tag?: string | undefined;
                    } & /*elided*/ any)[];
                })[] | undefined;
                categories?: {
                    lvl0: string[];
                    lvl1: string[];
                    lvl2: string[];
                    lvl3: string[];
                    lvl4: string[];
                } | undefined;
                categoryNames?: string[] | undefined;
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
                    url: string;
                    id: string;
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
                categoryIds: string[];
                purchasePrice?: number | undefined;
                profitPercentage?: number | undefined;
                isDiscountable?: boolean | undefined;
                categoryList?: ({
                    id: string;
                    companyId: string;
                    storeId: string;
                    locales: {
                        value: string;
                        lang: "he";
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                    tag?: string | undefined;
                } & {
                    children: ({
                        id: string;
                        companyId: string;
                        storeId: string;
                        locales: {
                            value: string;
                            lang: "he";
                        }[];
                        depth: number;
                        parentId?: string | null | undefined;
                        tag?: string | undefined;
                    } & /*elided*/ any)[];
                })[] | undefined;
                categories?: {
                    lvl0: string[];
                    lvl1: string[];
                    lvl2: string[];
                    lvl3: string[];
                    lvl4: string[];
                } | undefined;
                categoryNames?: string[] | undefined;
            }>;
            originalPrice: z.ZodOptional<z.ZodNumber>;
            finalPrice: z.ZodOptional<z.ZodNumber>;
            finalDiscount: z.ZodOptional<z.ZodNumber>;
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
                    url: string;
                    id: string;
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
                categoryIds: string[];
                purchasePrice?: number | undefined;
                profitPercentage?: number | undefined;
                isDiscountable?: boolean | undefined;
                categoryList?: ({
                    id: string;
                    companyId: string;
                    storeId: string;
                    locales: {
                        value: string;
                        lang: "he";
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                    tag?: string | undefined;
                } & {
                    children: ({
                        id: string;
                        companyId: string;
                        storeId: string;
                        locales: {
                            value: string;
                            lang: "he";
                        }[];
                        depth: number;
                        parentId?: string | null | undefined;
                        tag?: string | undefined;
                    } & /*elided*/ any)[];
                })[] | undefined;
                categories?: {
                    lvl0: string[];
                    lvl1: string[];
                    lvl2: string[];
                    lvl3: string[];
                    lvl4: string[];
                } | undefined;
                categoryNames?: string[] | undefined;
            };
            amount: number;
            originalPrice?: number | undefined;
            finalPrice?: number | undefined;
            finalDiscount?: number | undefined;
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
                    url: string;
                    id: string;
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
                categoryIds: string[];
                purchasePrice?: number | undefined;
                profitPercentage?: number | undefined;
                isDiscountable?: boolean | undefined;
                categoryList?: ({
                    id: string;
                    companyId: string;
                    storeId: string;
                    locales: {
                        value: string;
                        lang: "he";
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                    tag?: string | undefined;
                } & {
                    children: ({
                        id: string;
                        companyId: string;
                        storeId: string;
                        locales: {
                            value: string;
                            lang: "he";
                        }[];
                        depth: number;
                        parentId?: string | null | undefined;
                        tag?: string | undefined;
                    } & /*elided*/ any)[];
                })[] | undefined;
                categories?: {
                    lvl0: string[];
                    lvl1: string[];
                    lvl2: string[];
                    lvl3: string[];
                    lvl4: string[];
                } | undefined;
                categoryNames?: string[] | undefined;
            };
            amount: number;
            originalPrice?: number | undefined;
            finalPrice?: number | undefined;
            finalDiscount?: number | undefined;
        }>, "many">;
        cartDiscount: z.ZodNumber;
        cartTotal: z.ZodNumber;
        cartVat: z.ZodNumber;
        deliveryPrice: z.ZodOptional<z.ZodNumber>;
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
                    url: string;
                    id: string;
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
                categoryIds: string[];
                purchasePrice?: number | undefined;
                profitPercentage?: number | undefined;
                isDiscountable?: boolean | undefined;
                categoryList?: ({
                    id: string;
                    companyId: string;
                    storeId: string;
                    locales: {
                        value: string;
                        lang: "he";
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                    tag?: string | undefined;
                } & {
                    children: ({
                        id: string;
                        companyId: string;
                        storeId: string;
                        locales: {
                            value: string;
                            lang: "he";
                        }[];
                        depth: number;
                        parentId?: string | null | undefined;
                        tag?: string | undefined;
                    } & /*elided*/ any)[];
                })[] | undefined;
                categories?: {
                    lvl0: string[];
                    lvl1: string[];
                    lvl2: string[];
                    lvl3: string[];
                    lvl4: string[];
                } | undefined;
                categoryNames?: string[] | undefined;
            };
            amount: number;
            originalPrice?: number | undefined;
            finalPrice?: number | undefined;
            finalDiscount?: number | undefined;
        }[];
        cartDiscount: number;
        cartTotal: number;
        cartVat: number;
        deliveryPrice?: number | undefined;
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
                    url: string;
                    id: string;
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
                categoryIds: string[];
                purchasePrice?: number | undefined;
                profitPercentage?: number | undefined;
                isDiscountable?: boolean | undefined;
                categoryList?: ({
                    id: string;
                    companyId: string;
                    storeId: string;
                    locales: {
                        value: string;
                        lang: "he";
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                    tag?: string | undefined;
                } & {
                    children: ({
                        id: string;
                        companyId: string;
                        storeId: string;
                        locales: {
                            value: string;
                            lang: "he";
                        }[];
                        depth: number;
                        parentId?: string | null | undefined;
                        tag?: string | undefined;
                    } & /*elided*/ any)[];
                })[] | undefined;
                categories?: {
                    lvl0: string[];
                    lvl1: string[];
                    lvl2: string[];
                    lvl3: string[];
                    lvl4: string[];
                } | undefined;
                categoryNames?: string[] | undefined;
            };
            amount: number;
            originalPrice?: number | undefined;
            finalPrice?: number | undefined;
            finalDiscount?: number | undefined;
        }[];
        cartDiscount: number;
        cartTotal: number;
        cartVat: number;
        deliveryPrice?: number | undefined;
    }>;
    storeOptions: z.ZodOptional<z.ZodObject<{
        deliveryPrice: z.ZodOptional<z.ZodNumber>;
        freeDeliveryPrice: z.ZodOptional<z.ZodNumber>;
        isVatIncludedInPrice: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        deliveryPrice?: number | undefined;
        freeDeliveryPrice?: number | undefined;
        isVatIncludedInPrice?: boolean | undefined;
    }, {
        deliveryPrice?: number | undefined;
        freeDeliveryPrice?: number | undefined;
        isVatIncludedInPrice?: boolean | undefined;
    }>>;
    orderDeliveryPrice: z.ZodOptional<z.ZodNumber>;
    originalAmount: z.ZodOptional<z.ZodNumber>;
    actualAmount: z.ZodOptional<z.ZodNumber>;
    date: z.ZodNumber;
    deliveryDate: z.ZodNumber;
    client: z.ZodObject<{
        type: z.ZodLiteral<"Profile">;
        id: z.ZodString;
        companyId: z.ZodString;
        storeId: z.ZodString;
        tenantId: z.ZodString;
        clientType: z.ZodEnum<["user", "company"]>;
        companyName: z.ZodOptional<z.ZodString>;
        displayName: z.ZodString;
        email: z.ZodString;
        phoneNumber: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodObject<{
            country: z.ZodOptional<z.ZodString>;
            city: z.ZodOptional<z.ZodString>;
            street: z.ZodOptional<z.ZodString>;
            streetNumber: z.ZodOptional<z.ZodString>;
            floor: z.ZodOptional<z.ZodString>;
            apartmentEnterNumber: z.ZodOptional<z.ZodString>;
            apartmentNumber: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            country?: string | undefined;
            city?: string | undefined;
            street?: string | undefined;
            streetNumber?: string | undefined;
            floor?: string | undefined;
            apartmentEnterNumber?: string | undefined;
            apartmentNumber?: string | undefined;
        }, {
            country?: string | undefined;
            city?: string | undefined;
            street?: string | undefined;
            streetNumber?: string | undefined;
            floor?: string | undefined;
            apartmentEnterNumber?: string | undefined;
            apartmentNumber?: string | undefined;
        }>>;
        isAnonymous: z.ZodBoolean;
        createdDate: z.ZodNumber;
        lastActivityDate: z.ZodNumber;
        paymentType: z.ZodEnum<["default", "delayed"]>;
        organizationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        type: "Profile";
        id: string;
        companyId: string;
        storeId: string;
        tenantId: string;
        clientType: "user" | "company";
        displayName: string;
        email: string;
        isAnonymous: boolean;
        createdDate: number;
        lastActivityDate: number;
        paymentType: "default" | "delayed";
        companyName?: string | undefined;
        phoneNumber?: string | undefined;
        address?: {
            country?: string | undefined;
            city?: string | undefined;
            street?: string | undefined;
            streetNumber?: string | undefined;
            floor?: string | undefined;
            apartmentEnterNumber?: string | undefined;
            apartmentNumber?: string | undefined;
        } | undefined;
        organizationId?: string | null | undefined;
    }, {
        type: "Profile";
        id: string;
        companyId: string;
        storeId: string;
        tenantId: string;
        clientType: "user" | "company";
        displayName: string;
        email: string;
        isAnonymous: boolean;
        createdDate: number;
        lastActivityDate: number;
        paymentType: "default" | "delayed";
        companyName?: string | undefined;
        phoneNumber?: string | undefined;
        address?: {
            country?: string | undefined;
            city?: string | undefined;
            street?: string | undefined;
            streetNumber?: string | undefined;
            floor?: string | undefined;
            apartmentEnterNumber?: string | undefined;
            apartmentNumber?: string | undefined;
        } | undefined;
        organizationId?: string | null | undefined;
    }>;
    nameOnInvoice: z.ZodOptional<z.ZodString>;
    clientComment: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodOptional<z.ZodString>;
    billingAccount: z.ZodOptional<z.ZodObject<{
        number: z.ZodString;
        name: z.ZodString;
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        number: string;
        id: string;
        name: string;
    }, {
        number: string;
        id: string;
        name: string;
    }>>;
    deliveryNote: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        number: z.ZodString;
        date: z.ZodNumber;
        createdAt: z.ZodNumber;
        status: z.ZodEnum<["pending", "paid", "cancelled"]>;
        companyDetails: z.ZodOptional<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            address: z.ZodOptional<z.ZodString>;
            phone: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        }, {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        }>>;
        clientDetails: z.ZodOptional<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            address: z.ZodOptional<z.ZodString>;
            phone: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        }, {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        }>>;
        items: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            price: z.ZodOptional<z.ZodNumber>;
            quantity: z.ZodOptional<z.ZodNumber>;
            total: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            name?: string | undefined;
            price?: number | undefined;
            quantity?: number | undefined;
            total?: number | undefined;
        }, {
            name?: string | undefined;
            price?: number | undefined;
            quantity?: number | undefined;
            total?: number | undefined;
        }>, "many">>;
        total: z.ZodOptional<z.ZodNumber>;
        vat: z.ZodOptional<z.ZodNumber>;
        link: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        number: string;
        status: "pending" | "paid" | "cancelled";
        id: string;
        date: number;
        createdAt: number;
        vat?: number | undefined;
        items?: {
            name?: string | undefined;
            price?: number | undefined;
            quantity?: number | undefined;
            total?: number | undefined;
        }[] | undefined;
        companyDetails?: {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        } | undefined;
        clientDetails?: {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        } | undefined;
        total?: number | undefined;
        link?: string | undefined;
    }, {
        number: string;
        status: "pending" | "paid" | "cancelled";
        id: string;
        date: number;
        createdAt: number;
        vat?: number | undefined;
        items?: {
            name?: string | undefined;
            price?: number | undefined;
            quantity?: number | undefined;
            total?: number | undefined;
        }[] | undefined;
        companyDetails?: {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        } | undefined;
        clientDetails?: {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        } | undefined;
        total?: number | undefined;
        link?: string | undefined;
    }>>;
    invoice: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        number: z.ZodString;
        date: z.ZodString;
        createdAt: z.ZodNumber;
        status: z.ZodEnum<["pending", "paid", "cancelled"]>;
        companyDetails: z.ZodOptional<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            address: z.ZodOptional<z.ZodString>;
            phone: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        }, {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        }>>;
        clientDetails: z.ZodOptional<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            address: z.ZodOptional<z.ZodString>;
            phone: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        }, {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        }>>;
        items: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            price: z.ZodOptional<z.ZodNumber>;
            quantity: z.ZodOptional<z.ZodNumber>;
            total: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            name?: string | undefined;
            price?: number | undefined;
            quantity?: number | undefined;
            total?: number | undefined;
        }, {
            name?: string | undefined;
            price?: number | undefined;
            quantity?: number | undefined;
            total?: number | undefined;
        }>, "many">>;
        total: z.ZodOptional<z.ZodNumber>;
        vat: z.ZodOptional<z.ZodNumber>;
        link: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        number: string;
        status: "pending" | "paid" | "cancelled";
        id: string;
        date: string;
        createdAt: number;
        vat?: number | undefined;
        items?: {
            name?: string | undefined;
            price?: number | undefined;
            quantity?: number | undefined;
            total?: number | undefined;
        }[] | undefined;
        companyDetails?: {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        } | undefined;
        clientDetails?: {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        } | undefined;
        total?: number | undefined;
        link?: string | undefined;
    }, {
        number: string;
        status: "pending" | "paid" | "cancelled";
        id: string;
        date: string;
        createdAt: number;
        vat?: number | undefined;
        items?: {
            name?: string | undefined;
            price?: number | undefined;
            quantity?: number | undefined;
            total?: number | undefined;
        }[] | undefined;
        companyDetails?: {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        } | undefined;
        clientDetails?: {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        } | undefined;
        total?: number | undefined;
        link?: string | undefined;
    }>>;
    ezInvoice: z.ZodOptional<z.ZodObject<{
        doc_uuid: z.ZodString;
        pdf_link: z.ZodString;
        pdf_link_copy: z.ZodString;
        doc_number: z.ZodString;
        sent_mails: z.ZodArray<z.ZodString, "many">;
        success: z.ZodBoolean;
        ua_uuid: z.ZodString;
        calculatedData: z.ZodObject<{
            _COMMENT: z.ZodOptional<z.ZodString>;
            transaction_id: z.ZodString;
            date: z.ZodString;
            currency: z.ZodString;
            rate: z.ZodNumber;
            vat: z.ZodString;
            vat_price: z.ZodNumber;
            price_discount: z.ZodNumber;
            price_discount_in_currency: z.ZodNumber;
            price_total: z.ZodString;
            price_total_in_currency: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            date: string;
            vat: string;
            currency: string;
            transaction_id: string;
            rate: number;
            vat_price: number;
            price_discount: number;
            price_discount_in_currency: number;
            price_total: string;
            price_total_in_currency: number;
            _COMMENT?: string | undefined;
        }, {
            date: string;
            vat: string;
            currency: string;
            transaction_id: string;
            rate: number;
            vat_price: number;
            price_discount: number;
            price_discount_in_currency: number;
            price_total: string;
            price_total_in_currency: number;
            _COMMENT?: string | undefined;
        }>;
        warning: z.ZodOptional<z.ZodString>;
        date: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        doc_uuid: string;
        pdf_link: string;
        pdf_link_copy: string;
        doc_number: string;
        sent_mails: string[];
        success: boolean;
        ua_uuid: string;
        calculatedData: {
            date: string;
            vat: string;
            currency: string;
            transaction_id: string;
            rate: number;
            vat_price: number;
            price_discount: number;
            price_discount_in_currency: number;
            price_total: string;
            price_total_in_currency: number;
            _COMMENT?: string | undefined;
        };
        date?: number | undefined;
        warning?: string | undefined;
    }, {
        doc_uuid: string;
        pdf_link: string;
        pdf_link_copy: string;
        doc_number: string;
        sent_mails: string[];
        success: boolean;
        ua_uuid: string;
        calculatedData: {
            date: string;
            vat: string;
            currency: string;
            transaction_id: string;
            rate: number;
            vat_price: number;
            price_discount: number;
            price_discount_in_currency: number;
            price_total: string;
            price_total_in_currency: number;
            _COMMENT?: string | undefined;
        };
        date?: number | undefined;
        warning?: string | undefined;
    }>>;
    ezDeliveryNote: z.ZodOptional<z.ZodObject<{
        doc_uuid: z.ZodString;
        pdf_link: z.ZodString;
        pdf_link_copy: z.ZodString;
        doc_number: z.ZodString;
        sent_mails: z.ZodArray<z.ZodString, "many">;
        success: z.ZodBoolean;
        ua_uuid: z.ZodString;
        calculatedData: z.ZodObject<{
            _COMMENT: z.ZodOptional<z.ZodString>;
            transaction_id: z.ZodString;
            date: z.ZodString;
            currency: z.ZodString;
            rate: z.ZodNumber;
            vat: z.ZodString;
            vat_price: z.ZodNumber;
            price_discount: z.ZodNumber;
            price_discount_in_currency: z.ZodNumber;
            price_total: z.ZodString;
            price_total_in_currency: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            date: string;
            vat: string;
            currency: string;
            transaction_id: string;
            rate: number;
            vat_price: number;
            price_discount: number;
            price_discount_in_currency: number;
            price_total: string;
            price_total_in_currency: number;
            _COMMENT?: string | undefined;
        }, {
            date: string;
            vat: string;
            currency: string;
            transaction_id: string;
            rate: number;
            vat_price: number;
            price_discount: number;
            price_discount_in_currency: number;
            price_total: string;
            price_total_in_currency: number;
            _COMMENT?: string | undefined;
        }>;
        warning: z.ZodOptional<z.ZodString>;
        date: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        doc_uuid: string;
        pdf_link: string;
        pdf_link_copy: string;
        doc_number: string;
        sent_mails: string[];
        success: boolean;
        ua_uuid: string;
        calculatedData: {
            date: string;
            vat: string;
            currency: string;
            transaction_id: string;
            rate: number;
            vat_price: number;
            price_discount: number;
            price_discount_in_currency: number;
            price_total: string;
            price_total_in_currency: number;
            _COMMENT?: string | undefined;
        };
        date?: number | undefined;
        warning?: string | undefined;
    }, {
        doc_uuid: string;
        pdf_link: string;
        pdf_link_copy: string;
        doc_number: string;
        sent_mails: string[];
        success: boolean;
        ua_uuid: string;
        calculatedData: {
            date: string;
            vat: string;
            currency: string;
            transaction_id: string;
            rate: number;
            vat_price: number;
            price_discount: number;
            price_discount_in_currency: number;
            price_total: string;
            price_total_in_currency: number;
            _COMMENT?: string | undefined;
        };
        date?: number | undefined;
        warning?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "Order";
    status: "draft" | "completed" | "pending" | "cancelled" | "processing" | "in_delivery" | "delivered" | "refunded";
    id: string;
    date: number;
    companyId: string;
    storeId: string;
    userId: string;
    paymentStatus: "completed" | "pending" | "refunded" | "external" | "pending_j5" | "failed";
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
                    url: string;
                    id: string;
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
                categoryIds: string[];
                purchasePrice?: number | undefined;
                profitPercentage?: number | undefined;
                isDiscountable?: boolean | undefined;
                categoryList?: ({
                    id: string;
                    companyId: string;
                    storeId: string;
                    locales: {
                        value: string;
                        lang: "he";
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                    tag?: string | undefined;
                } & {
                    children: ({
                        id: string;
                        companyId: string;
                        storeId: string;
                        locales: {
                            value: string;
                            lang: "he";
                        }[];
                        depth: number;
                        parentId?: string | null | undefined;
                        tag?: string | undefined;
                    } & /*elided*/ any)[];
                })[] | undefined;
                categories?: {
                    lvl0: string[];
                    lvl1: string[];
                    lvl2: string[];
                    lvl3: string[];
                    lvl4: string[];
                } | undefined;
                categoryNames?: string[] | undefined;
            };
            amount: number;
            originalPrice?: number | undefined;
            finalPrice?: number | undefined;
            finalDiscount?: number | undefined;
        }[];
        cartDiscount: number;
        cartTotal: number;
        cartVat: number;
        deliveryPrice?: number | undefined;
    };
    deliveryDate: number;
    client: {
        type: "Profile";
        id: string;
        companyId: string;
        storeId: string;
        tenantId: string;
        clientType: "user" | "company";
        displayName: string;
        email: string;
        isAnonymous: boolean;
        createdDate: number;
        lastActivityDate: number;
        paymentType: "default" | "delayed";
        companyName?: string | undefined;
        phoneNumber?: string | undefined;
        address?: {
            country?: string | undefined;
            city?: string | undefined;
            street?: string | undefined;
            streetNumber?: string | undefined;
            floor?: string | undefined;
            apartmentEnterNumber?: string | undefined;
            apartmentNumber?: string | undefined;
        } | undefined;
        organizationId?: string | null | undefined;
    };
    paymentType?: "internal" | "external" | undefined;
    organizationId?: string | undefined;
    nameOnInvoice?: string | undefined;
    storeOptions?: {
        deliveryPrice?: number | undefined;
        freeDeliveryPrice?: number | undefined;
        isVatIncludedInPrice?: boolean | undefined;
    } | undefined;
    orderDeliveryPrice?: number | undefined;
    originalAmount?: number | undefined;
    actualAmount?: number | undefined;
    clientComment?: string | undefined;
    billingAccount?: {
        number: string;
        id: string;
        name: string;
    } | undefined;
    deliveryNote?: {
        number: string;
        status: "pending" | "paid" | "cancelled";
        id: string;
        date: number;
        createdAt: number;
        vat?: number | undefined;
        items?: {
            name?: string | undefined;
            price?: number | undefined;
            quantity?: number | undefined;
            total?: number | undefined;
        }[] | undefined;
        companyDetails?: {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        } | undefined;
        clientDetails?: {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        } | undefined;
        total?: number | undefined;
        link?: string | undefined;
    } | undefined;
    invoice?: {
        number: string;
        status: "pending" | "paid" | "cancelled";
        id: string;
        date: string;
        createdAt: number;
        vat?: number | undefined;
        items?: {
            name?: string | undefined;
            price?: number | undefined;
            quantity?: number | undefined;
            total?: number | undefined;
        }[] | undefined;
        companyDetails?: {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        } | undefined;
        clientDetails?: {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        } | undefined;
        total?: number | undefined;
        link?: string | undefined;
    } | undefined;
    ezInvoice?: {
        doc_uuid: string;
        pdf_link: string;
        pdf_link_copy: string;
        doc_number: string;
        sent_mails: string[];
        success: boolean;
        ua_uuid: string;
        calculatedData: {
            date: string;
            vat: string;
            currency: string;
            transaction_id: string;
            rate: number;
            vat_price: number;
            price_discount: number;
            price_discount_in_currency: number;
            price_total: string;
            price_total_in_currency: number;
            _COMMENT?: string | undefined;
        };
        date?: number | undefined;
        warning?: string | undefined;
    } | undefined;
    ezDeliveryNote?: {
        doc_uuid: string;
        pdf_link: string;
        pdf_link_copy: string;
        doc_number: string;
        sent_mails: string[];
        success: boolean;
        ua_uuid: string;
        calculatedData: {
            date: string;
            vat: string;
            currency: string;
            transaction_id: string;
            rate: number;
            vat_price: number;
            price_discount: number;
            price_discount_in_currency: number;
            price_total: string;
            price_total_in_currency: number;
            _COMMENT?: string | undefined;
        };
        date?: number | undefined;
        warning?: string | undefined;
    } | undefined;
}, {
    type: "Order";
    status: "draft" | "completed" | "pending" | "cancelled" | "processing" | "in_delivery" | "delivered" | "refunded";
    id: string;
    date: number;
    companyId: string;
    storeId: string;
    userId: string;
    paymentStatus: "completed" | "pending" | "refunded" | "external" | "pending_j5" | "failed";
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
                    url: string;
                    id: string;
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
                categoryIds: string[];
                purchasePrice?: number | undefined;
                profitPercentage?: number | undefined;
                isDiscountable?: boolean | undefined;
                categoryList?: ({
                    id: string;
                    companyId: string;
                    storeId: string;
                    locales: {
                        value: string;
                        lang: "he";
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                    tag?: string | undefined;
                } & {
                    children: ({
                        id: string;
                        companyId: string;
                        storeId: string;
                        locales: {
                            value: string;
                            lang: "he";
                        }[];
                        depth: number;
                        parentId?: string | null | undefined;
                        tag?: string | undefined;
                    } & /*elided*/ any)[];
                })[] | undefined;
                categories?: {
                    lvl0: string[];
                    lvl1: string[];
                    lvl2: string[];
                    lvl3: string[];
                    lvl4: string[];
                } | undefined;
                categoryNames?: string[] | undefined;
            };
            amount: number;
            originalPrice?: number | undefined;
            finalPrice?: number | undefined;
            finalDiscount?: number | undefined;
        }[];
        cartDiscount: number;
        cartTotal: number;
        cartVat: number;
        deliveryPrice?: number | undefined;
    };
    deliveryDate: number;
    client: {
        type: "Profile";
        id: string;
        companyId: string;
        storeId: string;
        tenantId: string;
        clientType: "user" | "company";
        displayName: string;
        email: string;
        isAnonymous: boolean;
        createdDate: number;
        lastActivityDate: number;
        paymentType: "default" | "delayed";
        companyName?: string | undefined;
        phoneNumber?: string | undefined;
        address?: {
            country?: string | undefined;
            city?: string | undefined;
            street?: string | undefined;
            streetNumber?: string | undefined;
            floor?: string | undefined;
            apartmentEnterNumber?: string | undefined;
            apartmentNumber?: string | undefined;
        } | undefined;
        organizationId?: string | null | undefined;
    };
    paymentType?: "internal" | "external" | undefined;
    organizationId?: string | undefined;
    nameOnInvoice?: string | undefined;
    storeOptions?: {
        deliveryPrice?: number | undefined;
        freeDeliveryPrice?: number | undefined;
        isVatIncludedInPrice?: boolean | undefined;
    } | undefined;
    orderDeliveryPrice?: number | undefined;
    originalAmount?: number | undefined;
    actualAmount?: number | undefined;
    clientComment?: string | undefined;
    billingAccount?: {
        number: string;
        id: string;
        name: string;
    } | undefined;
    deliveryNote?: {
        number: string;
        status: "pending" | "paid" | "cancelled";
        id: string;
        date: number;
        createdAt: number;
        vat?: number | undefined;
        items?: {
            name?: string | undefined;
            price?: number | undefined;
            quantity?: number | undefined;
            total?: number | undefined;
        }[] | undefined;
        companyDetails?: {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        } | undefined;
        clientDetails?: {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        } | undefined;
        total?: number | undefined;
        link?: string | undefined;
    } | undefined;
    invoice?: {
        number: string;
        status: "pending" | "paid" | "cancelled";
        id: string;
        date: string;
        createdAt: number;
        vat?: number | undefined;
        items?: {
            name?: string | undefined;
            price?: number | undefined;
            quantity?: number | undefined;
            total?: number | undefined;
        }[] | undefined;
        companyDetails?: {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        } | undefined;
        clientDetails?: {
            name?: string | undefined;
            email?: string | undefined;
            address?: string | undefined;
            phone?: string | undefined;
        } | undefined;
        total?: number | undefined;
        link?: string | undefined;
    } | undefined;
    ezInvoice?: {
        doc_uuid: string;
        pdf_link: string;
        pdf_link_copy: string;
        doc_number: string;
        sent_mails: string[];
        success: boolean;
        ua_uuid: string;
        calculatedData: {
            date: string;
            vat: string;
            currency: string;
            transaction_id: string;
            rate: number;
            vat_price: number;
            price_discount: number;
            price_discount_in_currency: number;
            price_total: string;
            price_total_in_currency: number;
            _COMMENT?: string | undefined;
        };
        date?: number | undefined;
        warning?: string | undefined;
    } | undefined;
    ezDeliveryNote?: {
        doc_uuid: string;
        pdf_link: string;
        pdf_link_copy: string;
        doc_number: string;
        sent_mails: string[];
        success: boolean;
        ua_uuid: string;
        calculatedData: {
            date: string;
            vat: string;
            currency: string;
            transaction_id: string;
            rate: number;
            vat_price: number;
            price_discount: number;
            price_discount_in_currency: number;
            price_total: string;
            price_total_in_currency: number;
            _COMMENT?: string | undefined;
        };
        date?: number | undefined;
        warning?: string | undefined;
    } | undefined;
}>;
export type TOrder = z.infer<typeof OrderSchema>;
//# sourceMappingURL=Order.d.ts.map