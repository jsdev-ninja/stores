import { DiscountStrategy } from "../strategy";
import { TDiscount, DiscountResult, DiscountContext } from "../types";
export declare class BundleDiscountStrategy implements DiscountStrategy {
    canApply(discount: TDiscount, context: DiscountContext): boolean;
    calculate(discount: TDiscount, context: DiscountContext): DiscountResult;
    private isDiscountActive;
    private getTotalQuantity;
    private calculateOriginalPrice;
    private calculateDiscountedPrice;
    private distributeDiscount;
}
//# sourceMappingURL=BundleStrategy.d.ts.map