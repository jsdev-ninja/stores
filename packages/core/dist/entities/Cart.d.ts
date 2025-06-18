import { z } from "zod";
export declare const CartItemProductSchema: z.ZodObject<{
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
        categoryList: z.ZodArray<z.ZodType<{
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
        categoryList: ({
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
        isDiscountable?: boolean | undefined;
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
        categoryList: ({
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
        isDiscountable?: boolean | undefined;
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
        categoryList: ({
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
        isDiscountable?: boolean | undefined;
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
        categoryList: ({
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
        isDiscountable?: boolean | undefined;
    };
    amount: number;
    originalPrice?: number | undefined;
    finalPrice?: number | undefined;
    finalDiscount?: number | undefined;
}>;
export type TCartItemProduct = z.infer<typeof CartItemProductSchema>;
export declare const CartSchema: z.ZodObject<{
    type: z.ZodLiteral<"Cart">;
    id: z.ZodString;
    companyId: z.ZodString;
    storeId: z.ZodString;
    userId: z.ZodString;
    status: z.ZodEnum<["active", "draft", "completed"]>;
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
            categoryList: z.ZodArray<z.ZodType<{
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
            categoryList: ({
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
            isDiscountable?: boolean | undefined;
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
            categoryList: ({
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
            isDiscountable?: boolean | undefined;
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
            categoryList: ({
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
            isDiscountable?: boolean | undefined;
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
            categoryList: ({
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
            isDiscountable?: boolean | undefined;
        };
        amount: number;
        originalPrice?: number | undefined;
        finalPrice?: number | undefined;
        finalDiscount?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "Cart";
    status: "active" | "draft" | "completed";
    id: string;
    companyId: string;
    storeId: string;
    userId: string;
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
            categoryList: ({
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
            isDiscountable?: boolean | undefined;
        };
        amount: number;
        originalPrice?: number | undefined;
        finalPrice?: number | undefined;
        finalDiscount?: number | undefined;
    }[];
}, {
    type: "Cart";
    status: "active" | "draft" | "completed";
    id: string;
    companyId: string;
    storeId: string;
    userId: string;
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
            categoryList: ({
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
            isDiscountable?: boolean | undefined;
        };
        amount: number;
        originalPrice?: number | undefined;
        finalPrice?: number | undefined;
        finalDiscount?: number | undefined;
    }[];
}>;
export type TCart = z.infer<typeof CartSchema>;
//# sourceMappingURL=Cart.d.ts.map