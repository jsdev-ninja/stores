import { TProduct, TDiscount, DiscountEngine, DiscountStrategyFactory } from "@jsdev_ninja/core";
import { formatter } from "src/utils/formatter";

export interface ProductDiscountInfo {
	hasDiscount: boolean;
	discounts: TDiscount[];
	bestDiscount?: {
		discount: TDiscount;
		percentage: number;
		savings: number;
	};
}

/**
 * Check if a product is part of any active discount
 */
export function getProductDiscountInfo(
	product: TProduct,
	allDiscounts: TDiscount[]
): ProductDiscountInfo {
	// Get active discounts
	const activeDiscounts = DiscountEngine.getActiveDiscounts(allDiscounts);

	// Filter discounts that include this product using strategy pattern
	const productDiscounts = activeDiscounts.filter((discount) => {
		const strategy = DiscountStrategyFactory.getStrategy(discount);
		if (!strategy) return false;

		// Use strategy to check if product is included in this discount
		return isProductInDiscount(product, discount);
	});

	if (productDiscounts.length === 0) {
		return {
			hasDiscount: false,
			discounts: [],
		};
	}

	// Calculate the best discount (highest percentage)
	let bestDiscount: ProductDiscountInfo["bestDiscount"] | undefined;

	for (const discount of productDiscounts) {
		const strategy = DiscountStrategyFactory.getStrategy(discount);
		if (!strategy) continue;

		// Calculate discount percentage using strategy
		const discountCalculation = calculateDiscountPercentage(product, discount);
		if (!discountCalculation) continue;

		const { percentage, savings } = discountCalculation;

		if (!bestDiscount || percentage > bestDiscount.percentage) {
			bestDiscount = {
				discount,
				percentage,
				savings,
			};
		}
	}

	return {
		hasDiscount: true,
		discounts: productDiscounts,
		bestDiscount,
	};
}

/**
 * Check if a product is included in a specific discount using strategy
 */
function isProductInDiscount(product: TProduct, discount: TDiscount): boolean {
	// For bundle discounts, check if product is in the productsId array
	if (discount.variant.variantType === "bundle") {
		return discount.variant.productsId.includes(product.id);
	}

	// For future discount types, the strategy should provide a method to check product inclusion
	// This is a placeholder for extensibility
	return false;
}

/**
 * Calculate discount percentage using strategy
 */
function calculateDiscountPercentage(
	product: TProduct,
	discount: TDiscount
): { percentage: number; savings: number } | null {
	// For bundle discounts, calculate based on bundle logic
	if (discount.variant.variantType === "bundle") {
		const originalPrice = discount.variant.requiredQuantity * product.price;
		const savings = originalPrice - discount.variant.bundlePrice;
		const percentage = Math.round((savings / originalPrice) * 100);

		return { percentage, savings };
	}

	// For future discount types, the strategy should provide a method to calculate percentage
	// This is a placeholder for extensibility
	return null;
}

/**
 * Get discount badge text for a product
 */
export function getDiscountBadgeText(product: TProduct, allDiscounts: TDiscount[]): string | null {
	const discountInfo = getProductDiscountInfo(product, allDiscounts);

	if (!discountInfo.hasDiscount || !discountInfo.bestDiscount) {
		return null;
	}

	const { percentage } = discountInfo.bestDiscount;
	return `-${percentage}%`;
}

/**
 * Get discount display text for a product (e.g., "Buy 3 for $25")
 */
export function getDiscountDisplayText(
	product: TProduct,
	allDiscounts: TDiscount[]
): string | null {
	const discountInfo = getProductDiscountInfo(product, allDiscounts);

	if (!discountInfo.hasDiscount || !discountInfo.bestDiscount) {
		return null;
	}

	const { discount } = discountInfo.bestDiscount;

	// For bundle discounts, show "X for Y" format
	if (discount.variant.variantType === "bundle") {
		const { requiredQuantity, bundlePrice } = discount.variant;
		return `${requiredQuantity} ${formatter.price(bundlePrice)}`;
	}

	// For future discount types, add specific display logic here
	return null;
}
