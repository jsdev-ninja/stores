import { describe, expect, test } from "vitest";
import { getCartCost, getFulfilledCartItems } from "./index";
import type { TCart, TProduct } from "../entities";

/** Minimal product fixture — only the fields getCartCost actually reads. */
function makeProduct(overrides: Partial<TProduct> & { price: number }): TProduct {
	return {
		type: "Product",
		storeId: "store-1",
		companyId: "company-1",
		id: "prod-1",
		objectID: "prod-1",
		sku: "SKU-1",
		name: [{ locale: "he", value: "מוצר" }],
		description: [],
		isPublished: true,
		vat: false,
		priceType: { type: "unit", value: 1 },
		currency: "ILS",
		discount: { type: "none", value: 0 },
		weight: { value: 0, unit: "none" },
		volume: { value: 0, unit: "none" },
		images: [],
		manufacturer: "",
		brand: "",
		importer: "",
		supplier: "",
		ingredients: [],
		created_at: 0,
		updated_at: 0,
		categoryIds: [],
		...overrides,
	} as TProduct;
}

/** Minimal cart item fixture. */
function makeItem(
	product: TProduct,
	amount: number,
	extra?: Partial<TCart["items"][number]>,
): TCart["items"][number] {
	return { product, amount, ...extra };
}

describe("getFulfilledCartItems — shape normalisation only", () => {
	test("passes through items with no status unchanged", () => {
		const product = makeProduct({ price: 10 });
		const items = [makeItem(product, 2)];
		const result = getFulfilledCartItems(items);
		expect(result).toHaveLength(1);
		expect(result[0].amount).toBe(2);
		expect(result[0].product.price).toBe(10);
	});

	test("drops missing items", () => {
		const product = makeProduct({ price: 10 });
		const items = [
			makeItem(product, 1, { status: "missing" }),
			makeItem(product, 3),
		];
		const result = getFulfilledCartItems(items);
		expect(result).toHaveLength(1);
		expect(result[0].amount).toBe(3);
	});

	test("rewrites substituted item: product pinned to sub.price, discount neutralised", () => {
		const original = makeProduct({ price: 20 });
		const subProduct = makeProduct({
			id: "sub-prod",
			price: 15,
			discount: { type: "percent", value: 10 }, // would reduce to 13.5 if applied
		});
		const items = [
			makeItem(original, 2, {
				status: "substituted",
				substitutedWith: { product: subProduct, amount: 3, price: 15 },
			}),
		];
		const result = getFulfilledCartItems(items);
		expect(result).toHaveLength(1);
		// product.price pinned to sub.price
		expect(result[0].product.price).toBe(15);
		// discount neutralised (type:"none") so getCartCost won't re-discount
		expect(result[0].product.discount).toEqual({ type: "none", value: 0 });
		// amount from sub
		expect(result[0].amount).toBe(3);
		// getFulfilledCartItems does NOT set finalPrice — pricing is getCartCost's job
		expect(result[0].finalPrice).toBeUndefined();
	});

	test("is idempotent for substituted items", () => {
		const original = makeProduct({ price: 20 });
		const subProduct = makeProduct({
			id: "sub-prod",
			price: 15,
			discount: { type: "percent", value: 10 },
		});
		const item = makeItem(original, 2, {
			status: "substituted",
			substitutedWith: { product: subProduct, amount: 3, price: 15 },
		});
		const once = getFulfilledCartItems([item]);
		const twice = getFulfilledCartItems(once);
		// second pass re-reads substitutedWith from the original item (spread intact)
		// and re-pins to the same values — identical result
		expect(twice[0].product.price).toBe(15);
		expect(twice[0].product.discount).toEqual({ type: "none", value: 0 });
		expect(twice[0].amount).toBe(3);
		expect(twice[0].finalPrice).toBeUndefined();
	});
});

describe("getCartCost — picking-aware pricing", () => {
	test("non-picked cart prices exactly as before (no status fields)", () => {
		const product = makeProduct({ price: 100, vat: false });
		const items = [makeItem(product, 2)];
		const result = getCartCost({ cart: items, discounts: [] });
		expect(result.items).toHaveLength(1);
		expect(result.items[0].finalPrice).toBe(100);
		expect(result.cost).toBe(200);
		expect(result.finalCost).toBe(200);
	});

	test("non-picked cart with product discount is unchanged", () => {
		const product = makeProduct({
			price: 100,
			discount: { type: "percent", value: 10 }, // 10% off → finalPrice 90
		});
		const items = [makeItem(product, 2)];
		const result = getCartCost({ cart: items, discounts: [] });
		expect(result.items[0].finalPrice).toBe(90);
		expect(result.cost).toBe(180);
	});

	test("missing items are excluded from cost", () => {
		const product = makeProduct({ price: 50 });
		const items = [
			makeItem(product, 1, { status: "missing" }),
			makeItem(product, 2),
		];
		const result = getCartCost({ cart: items, discounts: [] });
		expect(result.items).toHaveLength(1);
		expect(result.cost).toBe(100); // only the 2-unit line
	});

	test("substituted line: finalPrice = sub.price regardless of substitute product's own discount (isVatIncludedInPrice: false)", () => {
		const original = makeProduct({ price: 80 });
		const subProduct = makeProduct({
			id: "sub",
			price: 60,
			discount: { type: "percent", value: 20 }, // would reduce to 48 if applied
		});
		const items = [
			makeItem(original, 1, {
				status: "substituted",
				substitutedWith: { product: subProduct, amount: 2, price: 60 },
			}),
		];
		const result = getCartCost({ cart: items, discounts: [], isVatIncludedInPrice: false });
		// finalPrice must be sub.price (60), NOT the re-discounted 48
		expect(result.items).toHaveLength(1);
		expect(result.items[0].finalPrice).toBe(60);
		expect(result.items[0].amount).toBe(2);
		expect(result.cost).toBe(120); // 60 × 2
		expect(result.finalCost).toBe(120);
	});

	test("mixed cart: one missing, one substituted with discounted sub, one normal", () => {
		const productA = makeProduct({ id: "a", price: 100 });
		const productB = makeProduct({ id: "b", price: 50 });
		const productC = makeProduct({ id: "c", price: 30 });
		const subProduct = makeProduct({
			id: "sub-b",
			price: 45,
			discount: { type: "number", value: 5 }, // would reduce to 40 if applied
		});

		const items = [
			makeItem(productA, 1, { status: "missing" }),
			makeItem(productB, 2, {
				status: "substituted",
				substitutedWith: { product: subProduct, amount: 3, price: 45 },
			}),
			makeItem(productC, 4),
		];

		const result = getCartCost({ cart: items, discounts: [] });

		// missing dropped, 2 lines remain
		expect(result.items).toHaveLength(2);

		// substituted line: finalPrice = sub.price = 45, amount = 3, total = 135
		const subLine = result.items.find((i) => i.product.id === "sub-b")!;
		expect(subLine.finalPrice).toBe(45);
		expect(subLine.amount).toBe(3);

		// normal line: finalPrice = 30, amount = 4, total = 120
		const normalLine = result.items.find((i) => i.product.id === "c")!;
		expect(normalLine.finalPrice).toBe(30);
		expect(normalLine.amount).toBe(4);

		// total cost = 135 + 120 = 255
		expect(result.cost).toBe(255);
		expect(result.finalCost).toBe(255);
	});

	test("substituted line: VAT added on top of sub.price when isVatIncludedInPrice: false", () => {
		const original = makeProduct({ price: 80, vat: false });
		const subProduct = makeProduct({
			id: "sub",
			price: 60,
			vat: true, // has VAT
			discount: { type: "percent", value: 20 }, // discount must be ignored
		});
		const items = [
			makeItem(original, 1, {
				status: "substituted",
				substitutedWith: { product: subProduct, amount: 1, price: 60 },
			}),
		];
		const result = getCartCost({ cart: items, discounts: [], isVatIncludedInPrice: false });
		// finalPrice = 60, VAT = 60 × 0.18 = 10.8, finalCost = 70.8
		expect(result.items[0].finalPrice).toBe(60);
		expect(result.vat).toBe(10.8);
		expect(result.finalCost).toBe(70.8);
		// Delivery-note lines (finalPrice × amount) reconcile to finalCost
		const lineTotal = result.items.reduce((sum, i) => sum + i.finalPrice * i.amount, 0);
		expect(lineTotal).toBe(60); // pre-VAT sum; finalCost includes VAT added on top
	});

	test("substituted line: Σ finalPrice × amount reconciles to finalCost when isVatIncludedInPrice: true", () => {
		// Core invariant for delivery-note correctness: when line items are priced via
		// getCartCost, their sum (finalPrice × amount) equals finalCost. This holds
		// for substituted lines only if their pricing goes through getCartCost (not
		// getFulfilledCartItems, which returns raw sub.price without VAT adjustment).
		const original = makeProduct({ price: 80, vat: false });
		const subProduct = makeProduct({
			id: "sub",
			price: 60,
			vat: true,
			discount: { type: "percent", value: 20 }, // must be stripped — sub.price is authoritative
		});
		const items = [
			makeItem(original, 1, {
				status: "substituted",
				substitutedWith: { product: subProduct, amount: 2, price: 60 },
			}),
		];
		const result = getCartCost({ cart: items, discounts: [], isVatIncludedInPrice: true });

		// Whatever finalPrice getCartCost computes for the line, the sum of
		// (finalPrice × amount) across all items must equal finalCost (no delivery here),
		// so that a delivery note built from getCartCost(...).items sums to cartTotal.
		const lineTotal = Number(
			result.items.reduce((sum, i) => sum + i.finalPrice * i.amount, 0).toFixed(2),
		);
		expect(lineTotal).toBe(result.finalCost);

		// The discount must not have been re-applied: the substitute's discounted price
		// (60 × 0.8 = 48) must NOT appear as finalPrice.
		expect(result.items[0].finalPrice).not.toBe(48);
		expect(result.items[0].finalPrice).not.toBe(48 * 1.18); // discounted + VAT
	});
});
