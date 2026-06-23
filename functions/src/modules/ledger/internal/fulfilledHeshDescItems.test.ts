import { describe, it, expect } from "vitest";
import { buildFulfilledHeshDescItems } from "./fulfilledHeshDescItems";
import type { TOrder } from "@jsdev_ninja/core";

// ---------------------------------------------------------------------------
// Minimal fixture builders
// ---------------------------------------------------------------------------

function makeProduct(overrides: Record<string, unknown> = {}) {
	return {
		sku: "SKU001",
		name: [{ value: "Test Product", locale: "he" }],
		vat: false,
		...overrides,
	};
}

function makeItem(overrides: Record<string, unknown> = {}) {
	return {
		product: makeProduct(),
		amount: 1,
		finalPrice: 10.0,
		...overrides,
	};
}

function makeOrder(cartOverrides: Record<string, unknown> = {}, storeOptions?: Record<string, unknown>): TOrder {
	return {
		cart: {
			items: [makeItem()],
			deliveryPrice: 10.0,
			cartTotal: 20.0,
			...cartOverrides,
		},
		storeOptions: storeOptions ?? undefined,
	} as unknown as TOrder;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("buildFulfilledHeshDescItems", () => {
	it("1. no picking statuses (all undefined) — returns all items with prices as ordered, includes delivery", () => {
		const order = makeOrder({
			items: [
				makeItem({ product: makeProduct({ sku: "A" }), amount: 2, finalPrice: 5.0 }),
				makeItem({ product: makeProduct({ sku: "B" }), amount: 1, finalPrice: 15.0 }),
			],
			deliveryPrice: 9.9,
		});
		const result = buildFulfilledHeshDescItems(order);
		expect(result).toHaveLength(3);
		expect(result[0]).toBe("[A~Test Product~2~5.00]");
		expect(result[1]).toBe("[B~Test Product~1~15.00]");
		expect(result[2]).toBe("[0~משלוח~1~9.90]");
	});

	it("2. one 'missing' item — that item is dropped, others are kept", () => {
		const order = makeOrder({
			items: [
				makeItem({ product: makeProduct({ sku: "KEEP" }), amount: 1, finalPrice: 20.0 }),
				makeItem({ product: makeProduct({ sku: "DROP" }), amount: 3, finalPrice: 5.0, status: "missing" }),
			],
			deliveryPrice: 0,
		});
		const result = buildFulfilledHeshDescItems(order);
		// only KEEP + no delivery (deliveryPrice 0)
		expect(result).toHaveLength(1);
		expect(result[0]).toContain("KEEP");
	});

	it("3. one 'substituted' item with substitutedWith — uses substitute product/amount/price/sku", () => {
		const subProduct = makeProduct({ sku: "SUB_SKU", name: [{ value: "Substitute", locale: "he" }], vat: false });
		const order = makeOrder({
			items: [
				makeItem({
					product: makeProduct({ sku: "ORIG_SKU" }),
					amount: 1,
					finalPrice: 10.0,
					status: "substituted",
					substitutedWith: {
						product: subProduct,
						amount: 2,
						price: 7.5,
					},
				}),
			],
			deliveryPrice: 0,
		});
		const result = buildFulfilledHeshDescItems(order);
		expect(result).toHaveLength(1);
		// Must use substitute's sku, name, amount and price
		expect(result[0]).toBe("[SUB_SKU~Substitute~2~7.50]");
	});

	it("4. 'substituted' with no substitutedWith (defensive) — treats as ordered (uses original product/amount/price)", () => {
		const order = makeOrder({
			items: [
				makeItem({
					product: makeProduct({ sku: "ORIG" }),
					amount: 3,
					finalPrice: 4.0,
					status: "substituted",
					substitutedWith: null,
				}),
			],
			deliveryPrice: 0,
		});
		const result = buildFulfilledHeshDescItems(order);
		expect(result).toHaveLength(1);
		expect(result[0]).toBe("[ORIG~Test Product~3~4.00]");
	});

	it("5. deliveryPrice === 0 — no delivery line appended", () => {
		const order = makeOrder({ deliveryPrice: 0 });
		const result = buildFulfilledHeshDescItems(order);
		// Only one item, no delivery
		expect(result).toHaveLength(1);
		expect(result.some((l) => l.includes("משלוח"))).toBe(false);
	});

	it("5b. deliveryPrice absent — no delivery line appended", () => {
		const order = makeOrder({ deliveryPrice: undefined });
		const result = buildFulfilledHeshDescItems(order);
		expect(result.some((l) => l.includes("משלוח"))).toBe(false);
	});

	it("6. isVatIncludedInPrice: true — no VAT multiplier applied even for vat:true products", () => {
		const order = makeOrder(
			{
				items: [makeItem({ product: makeProduct({ sku: "V", vat: true }), finalPrice: 10.0 })],
				deliveryPrice: 0,
			},
			{ isVatIncludedInPrice: true },
		);
		const result = buildFulfilledHeshDescItems(order);
		expect(result).toHaveLength(1);
		// Price must remain 10.00 — not multiplied by 1.18
		expect(result[0]).toBe("[V~Test Product~1~10.00]");
	});

	it("7. product.vat: false — no VAT multiplier even when store says not-included", () => {
		const order = makeOrder(
			{
				items: [makeItem({ product: makeProduct({ sku: "NV", vat: false }), finalPrice: 10.0 })],
				deliveryPrice: 0,
			},
			{ isVatIncludedInPrice: false },
		);
		const result = buildFulfilledHeshDescItems(order);
		expect(result).toHaveLength(1);
		// No VAT applied because product.vat is false
		expect(result[0]).toBe("[NV~Test Product~1~10.00]");
	});

	it("7b. product.vat: true and store isVatIncludedInPrice: false — VAT IS applied (18%)", () => {
		const order = makeOrder(
			{
				items: [makeItem({ product: makeProduct({ sku: "TV", vat: true }), finalPrice: 10.0 })],
				deliveryPrice: 0,
			},
			{ isVatIncludedInPrice: false },
		);
		const result = buildFulfilledHeshDescItems(order);
		expect(result).toHaveLength(1);
		// 10 * 1.18 = 11.80
		expect(result[0]).toBe("[TV~Test Product~1~11.80]");
	});
});
