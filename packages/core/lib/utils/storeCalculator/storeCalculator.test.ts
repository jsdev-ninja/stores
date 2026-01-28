import { expect, describe, test } from "vitest";
import { storeCalculator } from "./storeCalculator";


describe("storeCalculator", () => {
    describe("calcSalePriceFromMargin", () => {
        test("calculate correct price for margin 10% and purchase price 100", () => {
            expect(storeCalculator.calcSalePriceFromMargin(10, 100)).toBe(111.11);
        });
        test("return purchase price when margin is 0", () => {
            expect(storeCalculator.calcSalePriceFromMargin(0, 100)).toBe(100);
        });
        test("handles very high margin (99%) and purchase price 100", () => {
            expect(storeCalculator.calcSalePriceFromMargin(99, 100)).toBe(10000);
        });
        test("return purchase price when margin is 100", () => {
            expect(storeCalculator.calcSalePriceFromMargin(100, 100)).toBe(100);
        });
        test("return purchase price when purchase price is 0", () => {
            expect(storeCalculator.calcSalePriceFromMargin(10, 0)).toBe(0);
        });
        test("return purchase price when purchase price is negative", () => {
            expect(storeCalculator.calcSalePriceFromMargin(10, -100)).toBe(-100);
        });
        test("is reversible", () => {
            expect(storeCalculator.calcMarginFromSalePrice(storeCalculator.calcSalePriceFromMargin(30, 100), 100)).toBe(30);
        });

    });
    describe("calcMarginFromSalePrice", () => {
        test("calculate correct margin for sale price 111.11 and purchase price 100", () => {
            expect(storeCalculator.calcMarginFromSalePrice(111.11, 100)).toBe(10);
        });
        test("return 0 when sale price is 0", () => {
            expect(storeCalculator.calcMarginFromSalePrice(0, 100)).toBe(0);
        });
        test("return 0 when purchase price is 0", () => {
            expect(storeCalculator.calcMarginFromSalePrice(100, 0)).toBe(0);
        });
        test("return 0 when purchase price is negative", () => {
            expect(storeCalculator.calcMarginFromSalePrice(100, -100)).toBe(0);
        });
        test("is reversible", () => {
            expect(storeCalculator.calcSalePriceFromMargin(storeCalculator.calcMarginFromSalePrice(111.11, 100), 100)).toBe(111.11);
        });
        test("return 0 when margin is negative", () => {
            expect(storeCalculator.calcMarginFromSalePrice(100, -100)).toBe(0);
        });
        test("return 0 when margin is 100", () => {
            expect(storeCalculator.calcMarginFromSalePrice(100, 100)).toBe(0);
        });

    });

});