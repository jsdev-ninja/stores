/**
 * Utility functions for discount calculations
 */

/**
 * Formats a number to 2 decimal places and returns as a number
 * @param value - The number to format
 * @returns The formatted number with 2 decimal places
 */
export function formatCurrency(value: number): number {
  return Number(value.toFixed(2));
}

/**
 * Formats a number to 2 decimal places and returns as a string
 * @param value - The number to format
 * @returns The formatted string with 2 decimal places
 */
export function formatCurrencyString(value: number): string {
  return value.toFixed(2);
}

/**
 * Ensures a monetary value is never negative
 * @param value - The value to check
 * @returns The value, or 0 if negative
 */
export function ensureNonNegative(value: number): number {
  return Math.max(0, formatCurrency(value));
}

/**
 * Calculates the percentage discount
 * @param originalPrice - The original price
 * @param discountedPrice - The discounted price
 * @returns The percentage discount (0-100)
 */
export function calculatePercentageDiscount(originalPrice: number, discountedPrice: number): number {
  if (originalPrice <= 0) return 0;
  const discount = originalPrice - discountedPrice;
  return formatCurrency((discount / originalPrice) * 100);
} 