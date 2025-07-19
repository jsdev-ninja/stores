import { TDiscount, DiscountResult, DiscountContext } from "./types";

export interface DiscountStrategy {
  canApply(discount: TDiscount, context: DiscountContext): boolean;
  calculate(discount: TDiscount, context: DiscountContext): DiscountResult;
} 