import type { TOrder } from "@jsdev_ninja/core";

const VAT_RATE = 18;
const DELIVERY_NAME = "משלוח";

/**
 * Build heshDesc line items for HYP, honoring picking status on each cart line:
 *   - "missing"     → dropped (not charged)
 *   - "substituted" → use substitutedWith.product / amount / price
 *   - "delivered" / undefined → as ordered
 *
 * Adds the delivery line if cart.deliveryPrice > 0.
 *
 * Mirrors fulfilledCost() in OrderEditModal so the HYP charge matches the
 * fulfilled cart total. Originally fixed inline in chargeOrder via e05b6bd;
 * centralized here so the four HYP-payment endpoints stay consistent.
 *
 * Caller owns Amount calculation (whether to derive from cartTotal, sum the
 * items, etc.) — this helper only formats the lines.
 */
export function buildFulfilledHeshDescItems(order: TOrder): string[] {
	const isVatIncluded = order.storeOptions?.isVatIncludedInPrice ?? false;
	const postVatPrice = (base: number, hasVat: boolean) =>
		!isVatIncluded && hasVat ? base * (1 + VAT_RATE / 100) : base;

	const items = (order.cart?.items ?? [])
		.filter((item) => item.status !== "missing")
		.map((item) => {
			const sub =
				item.status === "substituted" && item.substitutedWith
					? item.substitutedWith
					: null;
			const product = sub ? sub.product : item.product;
			const amount = sub ? sub.amount : item.amount;
			const basePrice = sub ? sub.price : item.finalPrice ?? 0;
			const price = postVatPrice(basePrice, !!product.vat).toFixed(2);
			const sku = (product.sku ?? "").trim();
			const name = (product.name?.[0]?.value ?? "").trim();
			return `[${sku}~${name}~${amount}~${price}]`;
		});

	if (order.cart?.deliveryPrice) {
		items.push(`[0~${DELIVERY_NAME}~1~${order.cart.deliveryPrice.toFixed(2)}]`);
	}

	return items;
}
