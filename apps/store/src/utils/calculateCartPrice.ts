import { TProduct } from "@jsdev_ninja/core";
import { CONFIG } from "src/config";
import { TCart } from "src/domains/cart";

function calculateDiscount(product: TProduct) {
	if (product.discount?.type === "percent") {
		return (product.price * (product.discount.value ?? 100)) / 100;
	}
	if (product.discount?.type === "number") {
		return product.price - product.discount.value ?? 0;
	}
	return 0;
}

function getPriceAfterDiscount(product: TProduct) {
	if (product.discount?.type === "percent") {
		const dscountAmount = (product.price * product.discount.value) / 100;
		return product.price - dscountAmount;
	}
	if (product.discount?.type === "number") {
		const dscountAmount = product.price - product.discount.value;
		return dscountAmount;
	}
	return product.price;
}

export function calculateCartPrice(items: TCart["items"]) {
	return (items ?? []).reduce(
		(acc, item) => {
			const { product, amount } = item;
			const productPrice = getPriceAfterDiscount(product);
			const discount = calculateDiscount(product);

			const realPrice = product.price - discount;

			let productVatValue: number = 0;
			if (product.vat) {
				productVatValue = (realPrice * CONFIG.VAT) / 100;
				productVatValue = productVatValue * amount;
				acc.vat += productVatValue;
			}
			acc.cost += amount * product.price;
			acc.discount += discount ? amount * discount : discount;
			acc.finalCost += amount * productPrice + productVatValue;

			return acc;
		},
		{
			cost: 0,
			discount: 0,
			vat: 0,
			finalCost: 0,
		}
	);
}
