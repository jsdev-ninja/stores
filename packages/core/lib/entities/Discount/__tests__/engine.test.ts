import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { DiscountEngine } from "../engine";
import { DiscountStrategyFactory } from "../factory";
import { BundleDiscountStrategy } from "../strategies/BundleStrategy";
import { TDiscount } from "../types";

describe("DiscountEngine", () => {
  beforeEach(() => {
    DiscountStrategyFactory.clearStrategies();
    DiscountStrategyFactory.registerStrategy("bundle", new BundleDiscountStrategy());
  });
  
  afterEach(() => {
    DiscountStrategyFactory.clearStrategies();
  });
  
  describe("calculateDiscounts", () => {
    it("should apply bundle discount correctly", () => {
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
      
      const discounts: TDiscount[] = [
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
      expect(result.appliedDiscounts[0].discountId).toBe("bundle1");
      expect(result.items).toHaveLength(2);
      
      // Check final prices
      const product1Item = result.items.find(item => item.product.id === "product1");
      expect(product1Item?.finalPrice).toBeCloseTo(7.14, 2); // 10 - (5.71/2) = 7.145
      
      const product2Item = result.items.find(item => item.product.id === "product2");
      expect(product2Item?.finalPrice).toBeCloseTo(10.71, 2); // 15 - 4.29 = 10.71
    });
    
    it("should handle multiple discounts", () => {
      const cart = [
        {
          amount: 4,
          product: {
            id: "product1",
            price: 10,
          },
        },
      ];
      
      const discounts: TDiscount[] = [
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
            stackable: true, // Allow stacking
          },
        },
        {
          type: "Discount",
          storeId: "store1",
          companyId: "company1",
          id: "bundle2",
          name: [{ lang: "he", value: "Buy 2 for $15" }],
          active: true,
          startDate: Date.now() - 1000,
          endDate: Date.now() + 1000,
          variant: {
            variantType: "bundle",
            productsId: ["product1"],
            requiredQuantity: 2,
            bundlePrice: 15,
          },
          conditions: {
            stackable: true,
          },
        },
      ];
      
      const result = DiscountEngine.calculateDiscounts(cart, discounts);
      
      expect(result.appliedDiscounts).toHaveLength(2);
      expect(result.totalDiscount).toBeGreaterThan(0);
    });
    
    it("should filter out inactive discounts", () => {
      const cart = [
        {
          amount: 3,
          product: {
            id: "product1",
            price: 10,
          },
        },
      ];
      
      const discounts: TDiscount[] = [
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
    
    it("should handle empty cart", () => {
      const cart: Array<{
        amount: number;
        product: {
          id: string;
          price: number;
        };
      }> = [];
      const discounts: TDiscount[] = [
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
    
    it("should handle empty discounts", () => {
      const cart = [
        {
          amount: 2,
          product: {
            id: "product1",
            price: 10,
          },
        },
      ];
      
      const discounts: TDiscount[] = [];
      
      const result = DiscountEngine.calculateDiscounts(cart, discounts);
      
      expect(result.totalDiscount).toBe(0);
      expect(result.appliedDiscounts).toHaveLength(0);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].finalPrice).toBe(10); // No discount applied
    });
  });
  
  describe("isDiscountActive", () => {
    it("should return true for active discount", () => {
      const discount: TDiscount = {
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
      };
      
      expect(DiscountEngine.isDiscountActive(discount)).toBe(true);
    });
    
    it("should return false for inactive discount", () => {
      const discount: TDiscount = {
        type: "Discount",
        storeId: "store1",
        companyId: "company1",
        id: "bundle1",
        name: [{ lang: "he", value: "Buy 3 for $25" }],
        active: false,
        startDate: Date.now() - 1000,
        endDate: Date.now() + 1000,
        variant: {
          variantType: "bundle",
          productsId: ["product1"],
          requiredQuantity: 3,
          bundlePrice: 25,
        },
      };
      
      expect(DiscountEngine.isDiscountActive(discount)).toBe(false);
    });
    
    it("should return false for expired discount", () => {
      const discount: TDiscount = {
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
          productsId: ["product1"],
          requiredQuantity: 3,
          bundlePrice: 25,
        },
      };
      
      expect(DiscountEngine.isDiscountActive(discount)).toBe(false);
    });
  });
  
  describe("getActiveDiscounts", () => {
    it("should filter active discounts", () => {
      const discounts: TDiscount[] = [
        {
          type: "Discount",
          storeId: "store1",
          companyId: "company1",
          id: "active1",
          name: [{ lang: "he", value: "Active Discount" }],
          active: true,
          startDate: Date.now() - 1000,
          endDate: Date.now() + 1000,
          variant: {
            variantType: "bundle",
            productsId: ["product1"],
            requiredQuantity: 3,
            bundlePrice: 25,
          },
        },
        {
          type: "Discount",
          storeId: "store1",
          companyId: "company1",
          id: "inactive1",
          name: [{ lang: "he", value: "Inactive Discount" }],
          active: false,
          startDate: Date.now() - 1000,
          endDate: Date.now() + 1000,
          variant: {
            variantType: "bundle",
            productsId: ["product1"],
            requiredQuantity: 3,
            bundlePrice: 25,
          },
        },
      ];
      
      const activeDiscounts = DiscountEngine.getActiveDiscounts(discounts);
      
      expect(activeDiscounts).toHaveLength(1);
      expect(activeDiscounts[0].id).toBe("active1");
    });
  });
}); 