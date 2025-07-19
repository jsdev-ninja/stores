import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { DiscountStrategyFactory } from "../factory";
import { DiscountStrategy } from "../strategy";
import { TDiscount } from "../types";

describe("DiscountStrategyFactory", () => {
  beforeEach(() => {
    DiscountStrategyFactory.clearStrategies();
  });
  
  afterEach(() => {
    DiscountStrategyFactory.clearStrategies();
  });
  
  it("should register and get strategy", () => {
    const mockStrategy: DiscountStrategy = {
      canApply: () => false,
      calculate: () => ({ applicable: false, discountAmount: 0, affectedItems: [] }),
    };
    
    DiscountStrategyFactory.registerStrategy("bundle", mockStrategy);
    
    const discount: TDiscount = {
      type: "Discount",
      storeId: "store1",
      companyId: "company1",
      id: "test1",
      name: [{ lang: "he", value: "Test Discount" }],
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
    
    const result = DiscountStrategyFactory.getStrategy(discount);
    expect(result).toBe(mockStrategy);
  });
  
  it("should return null for unregistered strategy", () => {
    const discount: TDiscount = {
      type: "Discount",
      storeId: "store1",
      companyId: "company1",
      id: "test1",
      name: [{ lang: "he", value: "Test Discount" }],
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
    
    const result = DiscountStrategyFactory.getStrategy(discount);
    expect(result).toBeNull();
  });
  
  it("should get registered types", () => {
    const mockStrategy: DiscountStrategy = {
      canApply: () => false,
      calculate: () => ({ applicable: false, discountAmount: 0, affectedItems: [] }),
    };
    
    DiscountStrategyFactory.registerStrategy("bundle", mockStrategy);
    DiscountStrategyFactory.registerStrategy("percentage", mockStrategy);
    
    const types = DiscountStrategyFactory.getRegisteredTypes();
    expect(types).toEqual(["bundle", "percentage"]);
  });
  
  it("should clear strategies", () => {
    const mockStrategy: DiscountStrategy = {
      canApply: () => false,
      calculate: () => ({ applicable: false, discountAmount: 0, affectedItems: [] }),
    };
    
    DiscountStrategyFactory.registerStrategy("bundle", mockStrategy);
    expect(DiscountStrategyFactory.getRegisteredTypes()).toHaveLength(1);
    
    DiscountStrategyFactory.clearStrategies();
    expect(DiscountStrategyFactory.getRegisteredTypes()).toHaveLength(0);
  });
}); 