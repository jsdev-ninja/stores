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

/**
 * Absorb tiny rounding drift between a target amount (e.g. cart total) and the
 * raw sum of the heshDesc lines.
 *
 * HYP recomputes each heshDesc line (qty × price) on its side and rejects
 * (CCode=400, "סכום הפריטים אינו תואם לסכום לחיוב") when its item sum != Amount.
 * The reliable match is the RAW, unrounded items sum — the exact value HYP
 * derives — so we return it whenever the drift is small (≤ 0.20 ILS). Larger
 * gaps are left untouched so we don't silently mask a real pricing bug.
 *
 * NOTE: callers must send the returned value to HYP at full precision (String,
 * not toFixed(2)) — rounding it to 2dp reintroduces the very mismatch this fixes.
 */
/**
 * Sum heshDesc lines using per-line `toFixed(2)` rounding — the rounding HYP's
 * APISign form applies before summing. Used by the checkout/sign endpoints,
 * where `Amount` must equal this per-line sum exactly (NOT the raw float sum,
 * e.g. 16.87 + 24.90 = 41.769999… which serialises to a non-2dp string).
 */
export function sumHeshDescItems(items: string[]): number {
	const itemsSum = items.reduce((sum, line) => {
		const m = line.match(/~([\d.]+)~([\d.]+)\]$/);
		if (!m) return sum;
		return sum + Number((parseFloat(m[1]) * parseFloat(m[2])).toFixed(2));
	}, 0);
	return Number(itemsSum.toFixed(2));
}

export function fitAmountToItemsSum(amount: number, items: string[]): number {
	// Raw sum — no per-line rounding, no final rounding.
	const itemsSum = items.reduce((sum, line) => {
		const m = line.match(/~([\d.]+)~([\d.]+)\]$/);
		if (!m) return sum;
		return sum + parseFloat(m[1]) * parseFloat(m[2]);
	}, 0);
	const diff = Math.abs(amount - itemsSum);
	if (diff > 0 && diff <= 0.2) {
		return itemsSum;
	}
	return amount;
}
