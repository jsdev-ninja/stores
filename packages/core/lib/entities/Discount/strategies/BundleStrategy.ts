import { DiscountStrategy } from "../strategy";
import { TDiscount, DiscountResult, DiscountContext } from "../types";

export class BundleDiscountStrategy implements DiscountStrategy {
	canApply(discount: TDiscount, context: DiscountContext): boolean {
		if (discount.variant.variantType !== "bundle") return false;

		// Check if discount is active
		if (!this.isDiscountActive(discount)) return false;

		const { productsId, requiredQuantity } = discount.variant;

		// Check if cart has enough of the required products
		const totalQuantity = this.getTotalQuantity(context.cart, productsId);

		return totalQuantity >= requiredQuantity;
	}

	calculate(discount: TDiscount, context: DiscountContext): DiscountResult {
		if (discount.variant.variantType !== "bundle") {
			return { applicable: false, discountAmount: 0, affectedItems: [] };
		}

		const { productsId, requiredQuantity, bundlePrice } = discount.variant;

		// Get applicable items (only the products in the bundle)
		const applicableItems = context.cart.filter((item) => productsId.includes(item.product.id));

		const totalQuantity = this.getTotalQuantity(context.cart, productsId);
		const bundleCount = Math.floor(totalQuantity / requiredQuantity);

		if (bundleCount === 0) {
			return { applicable: false, discountAmount: 0, affectedItems: [] };
		}

		// Calculate original price for bundled items
		const originalPrice = this.calculateOriginalPrice(applicableItems);

		// Calculate discounted price
		const cartTotalQuantity = this.getTotalQuantity(context.cart, productsId);
		const discountedPrice = this.calculateDiscountedPrice(
			originalPrice,
			bundlePrice,
			bundleCount,
			requiredQuantity,
			cartTotalQuantity
		);

		const totalDiscount = originalPrice - discountedPrice;

		// Distribute discount proportionally among items
		const affectedItems = this.distributeDiscount(applicableItems, totalDiscount, originalPrice);

		return {
			applicable: true,
			discountAmount: Number(totalDiscount.toFixed(2)),
			affectedItems,
		};
	}

	private isDiscountActive(discount: TDiscount): boolean {
		const now = Date.now();
		return discount.active && discount.startDate <= now && discount.endDate >= now;
	}

	private getTotalQuantity(cart: DiscountContext["cart"], productIds: string[]): number {
		return cart
			.filter((item) => productIds.includes(item.product.id))
			.reduce((sum, item) => sum + item.amount, 0);
	}

	private calculateOriginalPrice(items: DiscountContext["cart"]): number {
		return items.reduce((sum, item) => sum + item.product.price * item.amount, 0);
	}

	private calculateDiscountedPrice(
		originalPrice: number,
		bundlePrice: number,
		bundleCount: number,
		requiredQuantity: number,
		totalQuantity: number
	): number {
		// For bundle discounts, we pay the bundle price for each complete bundle
		// and full price for any remaining items
		const bundledItemsPrice = bundlePrice * bundleCount;

		// For bundle discounts, we pay bundle price for complete bundles
		// and full price for remaining items
		// Since we're dealing with the total original price, we need to calculate
		// how much of the original price represents the bundled items vs remaining items
		const itemsInBundles = bundleCount * requiredQuantity;
		const remainingItems = Math.max(0, totalQuantity - itemsInBundles);

		// Calculate the proportion of original price that represents remaining items
		const remainingItemsPrice = (remainingItems / totalQuantity) * originalPrice;

		return bundledItemsPrice + remainingItemsPrice;
	}

	private distributeDiscount(
		items: DiscountContext["cart"],
		totalDiscount: number,
		originalPrice: number
	): DiscountResult["affectedItems"] {
		const discountRatio = totalDiscount / originalPrice;

		return items.map((item) => {
			const itemDiscount = item.product.price * item.amount * discountRatio;

			return {
				productId: item.product.id,
				quantity: item.amount,
				originalPrice: Number(item.product.price.toFixed(2)),
				discountedPrice: Number((item.product.price - itemDiscount / item.amount).toFixed(2)),
				discountAmount: Number(itemDiscount.toFixed(2)),
			};
		});
	}
}
