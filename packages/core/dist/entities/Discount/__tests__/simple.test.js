import { describe, it, expect, beforeEach } from "vitest";
import { DiscountEngine } from "../engine";
import { DiscountStrategyFactory } from "../factory";
import { BundleDiscountStrategy } from "../strategies/BundleStrategy";
describe("Simple Discount System Tests", () => {
    beforeEach(() => {
        DiscountStrategyFactory.clearStrategies();
        DiscountStrategyFactory.registerStrategy("bundle", new BundleDiscountStrategy());
    });
    it("should calculate basic bundle discount correctly", () => {
        const cart = [
            {
                amount: 2,
                product: {
                    id: "product1",
                    price: 10,
                },
            },
            {
                amount: 1,
                product: {
                    id: "product2",
                    price: 15,
                },
            },
        ];
        const discounts = [
            {
                type: "Discount",
                storeId: "store1",
                companyId: "company1",
                id: "bundle1",
                name: [{ lang: "he", value: "Buy 3 for $25" }],
                active: true,
                startDate: Date.now() - 1000,
                endDate: Date.now() + 1000,
                variant: {
                    variantType: "bundle",
                    productsId: ["product1", "product2"],
                    requiredQuantity: 3,
                    bundlePrice: 25,
                },
                conditions: {
                    stackable: false,
                },
            },
        ];
        const result = DiscountEngine.calculateDiscounts(cart, discounts);
        expect(result.totalDiscount).toBe(10);
        expect(result.appliedDiscounts).toHaveLength(1);
    });
    it("should not apply inactive discount", () => {
        const cart = [
            {
                amount: 3,
                product: {
                    id: "product1",
                    price: 10,
                },
            },
        ];
        const discounts = [
            {
                type: "Discount",
                storeId: "store1",
                companyId: "company1",
                id: "bundle1",
                name: [{ lang: "he", value: "Buy 3 for $25" }],
                active: false, // Inactive
                startDate: Date.now() - 1000,
                endDate: Date.now() + 1000,
                variant: {
                    variantType: "bundle",
                    productsId: ["product1"],
                    requiredQuantity: 3,
                    bundlePrice: 25,
                },
                conditions: {
                    stackable: false,
                },
            },
        ];
        const result = DiscountEngine.calculateDiscounts(cart, discounts);
        expect(result.totalDiscount).toBe(0);
        expect(result.appliedDiscounts).toHaveLength(0);
    });
    it("should not apply discount when not enough items", () => {
        const cart = [
            {
                amount: 2, // Only 2 items, need 3
                product: {
                    id: "product1",
                    price: 10,
                },
            },
        ];
        const discounts = [
            {
                type: "Discount",
                storeId: "store1",
                companyId: "company1",
                id: "bundle1",
                name: [{ lang: "he", value: "Buy 3 for $25" }],
                active: true,
                startDate: Date.now() - 1000,
                endDate: Date.now() + 1000,
                variant: {
                    variantType: "bundle",
                    productsId: ["product1"],
                    requiredQuantity: 3,
                    bundlePrice: 25,
                },
                conditions: {
                    stackable: false,
                },
            },
        ];
        const result = DiscountEngine.calculateDiscounts(cart, discounts);
        expect(result.totalDiscount).toBe(0);
        expect(result.appliedDiscounts).toHaveLength(0);
    });
    it("should handle Buy 2 Get 1 Free scenario", () => {
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
    });
    it("should handle empty cart", () => {
        const cart = [];
        const discounts = [
            {
                type: "Discount",
                storeId: "store1",
                companyId: "company1",
                id: "bundle1",
                name: [{ lang: "he", value: "Buy 3 for $25" }],
                active: true,
                startDate: Date.now() - 1000,
                endDate: Date.now() + 1000,
                variant: {
                    variantType: "bundle",
                    productsId: ["product1"],
                    requiredQuantity: 3,
                    bundlePrice: 25,
                },
                conditions: {
                    stackable: false,
                },
            },
        ];
        const result = DiscountEngine.calculateDiscounts(cart, discounts);
        expect(result.totalDiscount).toBe(0);
        expect(result.appliedDiscounts).toHaveLength(0);
        expect(result.items).toHaveLength(0);
    });
});
