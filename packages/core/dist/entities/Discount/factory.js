import { BundleDiscountStrategy } from "./strategies/BundleStrategy";
export class DiscountStrategyFactory {
    static getStrategy(discount) {
        return this.strategies.get(discount.variant.variantType) || null;
    }
    static registerStrategy(type, strategy) {
        this.strategies.set(type, strategy);
    }
    static getRegisteredTypes() {
        return Array.from(this.strategies.keys());
    }
    static clearStrategies() {
        this.strategies.clear();
    }
}
DiscountStrategyFactory.strategies = new Map([
    ["bundle", new BundleDiscountStrategy()],
]);
