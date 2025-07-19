import { TDiscount } from "./types";
import { DiscountStrategy } from "./strategy";
export declare class DiscountStrategyFactory {
    private static strategies;
    static getStrategy(discount: TDiscount): DiscountStrategy | null;
    static registerStrategy(type: string, strategy: DiscountStrategy): void;
    static getRegisteredTypes(): string[];
    static clearStrategies(): void;
}
//# sourceMappingURL=factory.d.ts.map