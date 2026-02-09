import { TProduct, TStore } from "@jsdev_ninja/core";
import { CONFIG } from "src/config";

export const getProductFinalPrice = (product: TProduct, store: TStore) => {
	if (!product) return 0;
	const hasDiscount = product.discount.type !== "none";

	let price =
		product.vat && store.isVatIncludedInPrice
			? product.price + (product.price * CONFIG.VAT) / 100
			: product.price;

	const discount = hasDiscount
		? product.discount.type === "number"
			? product.discount.value
			: (price * product.discount.value) / 100
		: 0;

	price = price - discount;

	return parseFloat(price.toFixed(2));
};
