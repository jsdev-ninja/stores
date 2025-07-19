import { TDiscount } from "./types";
import { DiscountStrategy } from "./strategy";
import { BundleDiscountStrategy } from "./strategies/BundleStrategy";

export class DiscountStrategyFactory {
  private static strategies: Map<string, DiscountStrategy> = new Map([
    ["bundle", new BundleDiscountStrategy()],
  ]);
  
  static getStrategy(discount: TDiscount): DiscountStrategy | null {
    return this.strategies.get(discount.variant.variantType) || null;
  }
  
  static registerStrategy(type: string, strategy: DiscountStrategy): void {
    this.strategies.set(type, strategy);
  }
  
  static getRegisteredTypes(): string[] {
    return Array.from(this.strategies.keys());
  }
  
  static clearStrategies(): void {
    this.strategies.clear();
  }
} 