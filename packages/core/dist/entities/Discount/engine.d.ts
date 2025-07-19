import { TDiscount, AppliedDiscount } from "./types";
export declare class DiscountEngine {
    static calculateDiscounts(cart: Array<{
        amount: number;
        product: {
            id: string;
            price: number;
        };
    }>, discounts: TDiscount[], user?: Record<string, unknown>): {
        items: Array<{
            amount: number;
            product: {
                id: string;
                price: number;
            };
            originalPrice: number;
            finalPrice: number;
            finalDiscount: number;
            appliedDiscounts: string[];
        }>;
        totalDiscount: number;
        appliedDiscounts: AppliedDiscount[];
    };
    private static filterActiveDiscounts;
    private static calculateFinalPrices;
    static isDiscountActive(discount: TDiscount): boolean;
    static getActiveDiscounts(discounts: TDiscount[]): TDiscount[];
}
//# sourceMappingURL=engine.d.ts.map