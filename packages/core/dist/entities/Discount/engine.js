import { DiscountStrategyFactory } from "./factory";
export class DiscountEngine {
    static calculateDiscounts(cart, discounts, user) {
        const context = {
            cart,
            user,
            appliedDiscounts: [],
        };
        // Filter active discounts
        const activeDiscounts = this.filterActiveDiscounts(discounts);
        // Apply discounts
        const appliedDiscounts = [];
        for (const discount of activeDiscounts) {
            const strategy = DiscountStrategyFactory.getStrategy(discount);
            if (!strategy)
                continue;
            // Check if discount can be applied
            if (!strategy.canApply(discount, context))
                continue;
            // Check if discount is stackable
            if (!discount.conditions?.stackable && appliedDiscounts.length > 0)
                continue;
            // Calculate discount
            const result = strategy.calculate(discount, context);
            if (!result.applicable)
                continue;
            // Apply discount
            appliedDiscounts.push({
                discountId: discount.id,
                discountName: discount.name[0]?.value || "Discount",
                discountAmount: Number(result.discountAmount.toFixed(2)),
                affectedItems: result.affectedItems,
            });
            // Update context for next iteration
            context.appliedDiscounts = appliedDiscounts;
        }
        // Calculate final prices
        const items = this.calculateFinalPrices(cart, appliedDiscounts);
        const totalDiscount = appliedDiscounts.reduce((sum, discount) => sum + discount.discountAmount, 0);
        return {
            items,
            totalDiscount: Number(totalDiscount.toFixed(2)),
            appliedDiscounts,
        };
    }
    static filterActiveDiscounts(discounts) {
        const now = Date.now();
        return discounts.filter(discount => discount.active &&
            discount.startDate <= now &&
            discount.endDate >= now);
    }
    static calculateFinalPrices(cart, appliedDiscounts) {
        return cart.map(item => {
            const itemDiscounts = appliedDiscounts.filter(discount => discount.affectedItems.some(affected => affected.productId === item.product.id));
            const totalItemDiscount = itemDiscounts.reduce((sum, discount) => {
                const affectedItem = discount.affectedItems.find(affected => affected.productId === item.product.id);
                return sum + (affectedItem?.discountAmount || 0);
            }, 0);
            const discountPerUnit = totalItemDiscount / item.amount;
            const finalPrice = item.product.price - discountPerUnit;
            return {
                amount: item.amount,
                product: item.product,
                originalPrice: Number(item.product.price.toFixed(2)),
                finalPrice: Number(Math.max(0, finalPrice).toFixed(2)),
                finalDiscount: Number(totalItemDiscount.toFixed(2)),
                appliedDiscounts: itemDiscounts.map(d => d.discountId),
            };
        });
    }
    static isDiscountActive(discount) {
        const now = Date.now();
        return discount.active &&
            discount.startDate <= now &&
            discount.endDate >= now;
    }
    static getActiveDiscounts(discounts) {
        return this.filterActiveDiscounts(discounts);
    }
}
