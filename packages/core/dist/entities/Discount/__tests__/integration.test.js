import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { DiscountEngine } from "../engine";
import { DiscountStrategyFactory } from "../factory";
import { BundleDiscountStrategy } from "../strategies/BundleStrategy";
describe("Discount System Integration", () => {
    beforeEach(() => {
        DiscountStrategyFactory.clearStrategies();
        DiscountStrategyFactory.registerStrategy("bundle", new BundleDiscountStrategy());
    });
    afterEach(() => {
        DiscountStrategyFactory.clearStrategies();
    });
    it("should handle real-world bundle scenario", () => {
        // Scenario: Buy 3 dairy products for $20
        const cart = [
            {
                amount: 2, // 2 milk
                product: {
                    id: "milk",
                    price: 8, // $8 each
                },
            },
            {
                amount: 1, // 1 yogurt
                product: {
                    id: "yogurt",
                    price: 6, // $6 each
                },
            },
            {
                amount: 1, // 1 bread (not in bundle)
                product: {
                    id: "bread",
                    price: 4, // $4 each
                },
            },
        ];
        const dairyBundle = {
            type: "Discount",
            storeId: "store1",
            companyId: "company1",
            id: "dairy-bundle",
            name: [{ lang: "he", value: "3 Dairy Products for $20" }],
            active: true,
            startDate: Date.now() - 1000,
            endDate: Date.now() + 1000,
            variant: {
                variantType: "bundle",
                productsId: ["milk", "yogurt", "cheese"], // Dairy products
                requiredQuantity: 3,
                bundlePrice: 20,
            },
            conditions: {
                stackable: false,
            },
        };
        const result = DiscountEngine.calculateDiscounts(cart, [dairyBundle]);
        // Original prices:
        // milk: 2 × $8 = $16
        // yogurt: 1 × $6 = $6
        // bread: 1 × $4 = $4
        // Total: $26
        // Bundle applies to milk + yogurt (3 items for $20)
        // Remaining: bread at $4
        // New total: $24
        expect(result.totalDiscount).toBe(2); // $26 - $24
        expect(result.appliedDiscounts).toHaveLength(1);
        expect(result.appliedDiscounts[0].discountId).toBe("dairy-bundle");
        // Check individual item prices
        const milkItem = result.items.find(item => item.product.id === "milk");
        expect(milkItem?.finalPrice).toBeCloseTo(7.28, 2); // 8 - (1.45/2) = 7.275
        const yogurtItem = result.items.find(item => item.product.id === "yogurt");
        expect(yogurtItem?.finalPrice).toBeCloseTo(5.45, 2); // 6 - 0.55 = 5.45
        const breadItem = result.items.find(item => item.product.id === "bread");
        expect(breadItem?.finalPrice).toBe(4); // No discount
    });
    it("should handle BOGO scenario", () => {
        // Scenario: Buy 2 Get 1 Free
        const cart = [
            {
                amount: 3, // Buy 3 items
                product: {
                    id: "product1",
                    price: 10, // $10 each
                },
            },
        ];
        const bogoDiscount = {
            type: "Discount",
            storeId: "store1",
            companyId: "company1",
            id: "bogo",
            name: [{ lang: "he", value: "Buy 2 Get 1 Free" }],
            active: true,
            startDate: Date.now() - 1000,
            endDate: Date.now() + 1000,
            variant: {
                variantType: "bundle",
                productsId: ["product1"],
                requiredQuantity: 3, // Buy 2 + get 1 free = 3 items
                bundlePrice: 20, // Price of 2 items (10 × 2)
            },
            conditions: {
                stackable: false,
            },
        };
        const result = DiscountEngine.calculateDiscounts(cart, [bogoDiscount]);
        // Original: 3 × $10 = $30
        // Bundle: 3 items for $20
        // Discount: $10
        expect(result.totalDiscount).toBe(10);
        expect(result.appliedDiscounts).toHaveLength(1);
        expect(result.items[0].finalPrice).toBeCloseTo(6.67, 2); // $20 / 3
    });
});
