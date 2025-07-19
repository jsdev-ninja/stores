import { describe, it, expect, beforeEach } from "vitest";
import { BundleDiscountStrategy } from "../BundleStrategy";
describe("BundleDiscountStrategy", () => {
    let strategy;
    let mockContext;
    beforeEach(() => {
        strategy = new BundleDiscountStrategy();
        mockContext = {
            cart: [
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
            ],
            user: undefined,
            appliedDiscounts: [],
        };
    });
    describe("canApply", () => {
        it("should return true for valid bundle discount", () => {
            const discount = {
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
            };
            expect(strategy.canApply(discount, mockContext)).toBe(true);
        });
        it("should return false for wrong variant type", () => {
            const discount = {
                ...mockDiscount,
                variant: {
                    variantType: "percentage",
                    percentage: 20,
                },
            };
            expect(strategy.canApply(discount, mockContext)).toBe(false);
        });
        it("should return false when not enough items", () => {
            const discount = {
                type: "Discount",
                storeId: "store1",
                companyId: "company1",
                id: "bundle1",
                name: [{ lang: "he", value: "Buy 5 for $40" }],
                active: true,
                startDate: Date.now() - 1000,
                endDate: Date.now() + 1000,
                variant: {
                    variantType: "bundle",
                    productsId: ["product1", "product2"],
                    requiredQuantity: 5, // Need 5, but cart only has 3
                    bundlePrice: 40,
                },
                conditions: {
                    stackable: false,
                },
            };
            expect(strategy.canApply(discount, mockContext)).toBe(false);
        });
        it("should return false when discount is inactive", () => {
            const discount = {
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
                    productsId: ["product1", "product2"],
                    requiredQuantity: 3,
                    bundlePrice: 25,
                },
                conditions: {
                    stackable: false,
                },
            };
            expect(strategy.canApply(discount, mockContext)).toBe(false);
        });
        it("should return false when discount is expired", () => {
            const discount = {
                type: "Discount",
                storeId: "store1",
                companyId: "company1",
                id: "bundle1",
                name: [{ lang: "he", value: "Buy 3 for $25" }],
                active: true,
                startDate: Date.now() - 2000,
                endDate: Date.now() - 1000, // Expired
                variant: {
                    variantType: "bundle",
                    productsId: ["product1", "product2"],
                    requiredQuantity: 3,
                    bundlePrice: 25,
                },
                conditions: {
                    stackable: false,
                },
            };
            expect(strategy.canApply(discount, mockContext)).toBe(false);
        });
    });
    describe("calculate", () => {
        it("should calculate bundle discount correctly", () => {
            const discount = {
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
            };
            const result = strategy.calculate(discount, mockContext);
            expect(result.applicable).toBe(true);
            expect(result.discountAmount).toBe(10); // (2×10 + 1×15) - 25 = 35 - 25 = 10
            expect(result.affectedItems).toHaveLength(2);
            // Check product1 discount
            const product1Item = result.affectedItems.find(item => item.productId === "product1");
            expect(product1Item).toBeDefined();
            expect(product1Item.discountAmount).toBeCloseTo(5.71, 2); // Proportional to 20/35
            // Check product2 discount
            const product2Item = result.affectedItems.find(item => item.productId === "product2");
            expect(product2Item).toBeDefined();
            expect(product2Item.discountAmount).toBeCloseTo(4.29, 2); // Proportional to 15/35
        });
        it("should handle multiple bundles", () => {
            const contextWithMoreItems = {
                cart: [
                    {
                        amount: 6, // 6 items
                        product: {
                            id: "product1",
                            price: 10,
                        },
                    },
                ],
                user: undefined,
                appliedDiscounts: [],
            };
            const discount = {
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
            };
            const result = strategy.calculate(discount, contextWithMoreItems);
            expect(result.applicable).toBe(true);
            expect(result.discountAmount).toBe(10); // (6×10) - (2×25) = 60 - 50 = 10
            expect(result.affectedItems).toHaveLength(1);
            expect(result.affectedItems[0].discountAmount).toBe(10);
        });
        it("should return not applicable for wrong variant type", () => {
            const discount = {
                ...mockDiscount,
                variant: {
                    variantType: "percentage",
                    percentage: 20,
                },
            };
            const result = strategy.calculate(discount, mockContext);
            expect(result.applicable).toBe(false);
            expect(result.discountAmount).toBe(0);
            expect(result.affectedItems).toHaveLength(0);
        });
        it("should return not applicable when not enough items", () => {
            const discount = {
                type: "Discount",
                storeId: "store1",
                companyId: "company1",
                id: "bundle1",
                name: [{ lang: "he", value: "Buy 5 for $40" }],
                active: true,
                startDate: Date.now() - 1000,
                endDate: Date.now() + 1000,
                variant: {
                    variantType: "bundle",
                    productsId: ["product1", "product2"],
                    requiredQuantity: 5,
                    bundlePrice: 40,
                },
                conditions: {
                    stackable: false,
                },
            };
            const result = strategy.calculate(discount, mockContext);
            expect(result.applicable).toBe(false);
            expect(result.discountAmount).toBe(0);
            expect(result.affectedItems).toHaveLength(0);
        });
    });
});
const mockDiscount = {
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
};
