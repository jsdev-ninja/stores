import { z } from "zod";
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
                lang: z.ZodString;
                value: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                lang: string;
                value: string;
            }, {
                lang: string;
                value: string;
            }>, "many">;
            description: z.ZodArray<z.ZodObject<{
                lang: z.ZodString;
                value: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                lang: string;
                value: string;
            }, {
                lang: string;
                value: string;
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
                lang: z.ZodString;
                value: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                lang: string;
                value: string;
            }, {
                lang: string;
                value: string;
            }>, "many">;
            created_at: z.ZodNumber;
            updated_at: z.ZodNumber;
            categoryList: z.ZodArray<z.ZodType<{
                id: string;
                companyId: string;
                storeId: string;
                tag: string;
                locales: {
                    lang: string;
                    value: string;
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
                        lang: string;
                        value: string;
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                } & any)[];
            }, z.ZodTypeDef, {
                id: string;
                companyId: string;
                storeId: string;
                tag: string;
                locales: {
                    lang: string;
                    value: string;
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
                        lang: string;
                        value: string;
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                } & any)[];
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
                lang: string;
                value: string;
            }[];
            description: {
                lang: string;
                value: string;
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
                lang: string;
                value: string;
            }[];
            created_at: number;
            updated_at: number;
            categoryList: ({
                id: string;
                companyId: string;
                storeId: string;
                tag: string;
                locales: {
                    lang: string;
                    value: string;
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
                        lang: string;
                        value: string;
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                } & any)[];
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
                lang: string;
                value: string;
            }[];
            description: {
                lang: string;
                value: string;
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
                lang: string;
                value: string;
            }[];
            created_at: number;
            updated_at: number;
            categoryList: ({
                id: string;
                companyId: string;
                storeId: string;
                tag: string;
                locales: {
                    lang: string;
                    value: string;
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
                        lang: string;
                        value: string;
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                } & any)[];
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
                lang: string;
                value: string;
            }[];
            description: {
                lang: string;
                value: string;
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
                lang: string;
                value: string;
            }[];
            created_at: number;
            updated_at: number;
            categoryList: ({
                id: string;
                companyId: string;
                storeId: string;
                tag: string;
                locales: {
                    lang: string;
                    value: string;
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
                        lang: string;
                        value: string;
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                } & any)[];
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
                lang: string;
                value: string;
            }[];
            description: {
                lang: string;
                value: string;
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
                lang: string;
                value: string;
            }[];
            created_at: number;
            updated_at: number;
            categoryList: ({
                id: string;
                companyId: string;
                storeId: string;
                tag: string;
                locales: {
                    lang: string;
                    value: string;
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
                        lang: string;
                        value: string;
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                } & any)[];
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
}, "strip", z.ZodTypeAny, {
    type: "Cart";
    status: "completed" | "active" | "draft";
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
                lang: string;
                value: string;
            }[];
            description: {
                lang: string;
                value: string;
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
                lang: string;
                value: string;
            }[];
            created_at: number;
            updated_at: number;
            categoryList: ({
                id: string;
                companyId: string;
                storeId: string;
                tag: string;
                locales: {
                    lang: string;
                    value: string;
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
                        lang: string;
                        value: string;
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                } & any)[];
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
}, {
    type: "Cart";
    status: "completed" | "active" | "draft";
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
                lang: string;
                value: string;
            }[];
            description: {
                lang: string;
                value: string;
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
                lang: string;
                value: string;
            }[];
            created_at: number;
            updated_at: number;
            categoryList: ({
                id: string;
                companyId: string;
                storeId: string;
                tag: string;
                locales: {
                    lang: string;
                    value: string;
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
                        lang: string;
                        value: string;
                    }[];
                    depth: number;
                    parentId?: string | null | undefined;
                } & any)[];
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
}>;
export type TCart = z.infer<typeof CartSchema>;
//# sourceMappingURL=Cart.d.ts.map