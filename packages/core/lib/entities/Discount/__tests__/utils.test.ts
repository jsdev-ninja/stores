import { describe, it, expect } from "vitest";
import { 
  formatCurrency, 
  formatCurrencyString, 
  ensureNonNegative, 
  calculatePercentageDiscount 
} from "../utils";

describe("Discount Utils", () => {
  describe("formatCurrency", () => {
    it("should format numbers to 2 decimal places", () => {
      expect(formatCurrency(10)).toBe(10.00);
      expect(formatCurrency(10.123)).toBe(10.12);
      expect(formatCurrency(10.125)).toBe(10.13); // Rounds up
      expect(formatCurrency(10.124)).toBe(10.12); // Rounds down
      expect(formatCurrency(0)).toBe(0.00);
    });

    it("should return a number type", () => {
      const result = formatCurrency(10.123);
      expect(typeof result).toBe("number");
    });
  });

  describe("formatCurrencyString", () => {
    it("should format numbers to 2 decimal places as string", () => {
      expect(formatCurrencyString(10)).toBe("10.00");
      expect(formatCurrencyString(10.123)).toBe("10.12");
      expect(formatCurrencyString(10.125)).toBe("10.13");
      expect(formatCurrencyString(0)).toBe("0.00");
    });

    it("should return a string type", () => {
      const result = formatCurrencyString(10.123);
      expect(typeof result).toBe("string");
    });
  });

  describe("ensureNonNegative", () => {
    it("should return 0 for negative values", () => {
      expect(ensureNonNegative(-5)).toBe(0.00);
      expect(ensureNonNegative(-0.01)).toBe(0.00);
    });

    it("should return formatted value for positive values", () => {
      expect(ensureNonNegative(10.123)).toBe(10.12);
      expect(ensureNonNegative(0)).toBe(0.00);
    });
  });

  describe("calculatePercentageDiscount", () => {
    it("should calculate percentage discount correctly", () => {
      expect(calculatePercentageDiscount(100, 80)).toBe(20.00); // 20% discount
      expect(calculatePercentageDiscount(50, 25)).toBe(50.00); // 50% discount
      expect(calculatePercentageDiscount(100, 100)).toBe(0.00); // No discount
    });

    it("should handle edge cases", () => {
      expect(calculatePercentageDiscount(0, 0)).toBe(0.00);
      expect(calculatePercentageDiscount(100, 0)).toBe(100.00); // 100% discount
    });

    it("should return formatted number", () => {
      const result = calculatePercentageDiscount(100, 90.5);
      expect(typeof result).toBe("number");
      expect(result).toBe(9.50); // 9.5% discount
    });
  });
}); 