/**
 * Utility functions for discount calculations
 */
/**
 * Formats a number to 2 decimal places and returns as a number
 * @param value - The number to format
 * @returns The formatted number with 2 decimal places
 */
export declare function formatCurrency(value: number): number;
/**
 * Formats a number to 2 decimal places and returns as a string
 * @param value - The number to format
 * @returns The formatted string with 2 decimal places
 */
export declare function formatCurrencyString(value: number): string;
/**
 * Ensures a monetary value is never negative
 * @param value - The value to check
 * @returns The value, or 0 if negative
 */
export declare function ensureNonNegative(value: number): number;
/**
 * Calculates the percentage discount
 * @param originalPrice - The original price
 * @param discountedPrice - The discounted price
 * @returns The percentage discount (0-100)
 */
export declare function calculatePercentageDiscount(originalPrice: number, discountedPrice: number): number;
//# sourceMappingURL=utils.d.ts.map