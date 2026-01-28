import { describe, expect, test } from "vitest";
import { math } from "./math";


describe("math", () => {
    describe("round", () => {
        test("round to 2 decimal places", () => {
            expect(math.round(1.2345, 2)).toBe(1.23);
        });
        test("round to 0 decimal places", () => {
            expect(math.round(1.2345, 0)).toBe(1);
        });
        test("round to 1 decimal places", () => {
            expect(math.round(1.2345, 1)).toBe(1.2);
        });
        test("round to 3 decimal places", () => {
            expect(math.round(1.2345, 3)).toBe(1.235);
        });
        test("round to 4 decimal places", () => {
            expect(math.round(1.2345, 4)).toBe(1.2345);
        });
        test("round to 5 decimal places", () => {
            expect(math.round(1.2345, 5)).toBe(1.2345);
        });
        test("round to 6 decimal places", () => {
            expect(math.round(1.2345, 6)).toBe(1.2345);
        });
        test("round to 7 decimal places", () => {
            expect(math.round(1.2345, 7)).toBe(1.2345);
        });
        test("round to 8 decimal places", () => {
            expect(math.round(1.2345, 8)).toBe(1.2345);
        });
        test("round to 9 decimal places", () => {
            expect(math.round(1.2345, 9)).toBe(1.2345);
        });
    });
});