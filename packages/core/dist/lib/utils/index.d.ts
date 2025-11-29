import { TCart, TDiscount } from "../entities";
export declare function getCartCost({ cart, discounts, deliveryPrice, freeDeliveryPrice, isVatIncludedInPrice, }: {
    cart: TCart["items"];
    discounts: TDiscount[];
    deliveryPrice?: number;
    freeDeliveryPrice?: number;
    isVatIncludedInPrice?: boolean;
}): {
    discount: number;
    cost: number;
    finalCost: number;
    vat: number;
    productsCost: number;
    deliveryPrice: number;
    items: {
        amount: number;
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
        originalPrice: number;
        finalPrice: number;
        finalDiscount: number;
    }[];
};
//# sourceMappingURL=index.d.ts.map