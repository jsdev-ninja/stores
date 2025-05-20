import { TProduct, TStore } from "@jsdev_ninja/core";
import { CONFIG } from "src/config";

export const getProductFinalPrice = (product: TProduct, store: TStore) => {
	if (!product) return 0;
	const hasDiscount = product.discount.type !== "none";

	const discount = hasDiscount
		? product.discount.type === "number"
			? product.discount.value
			: (product.price * product.discount.value) / 100
		: 0;

	let price = 0;

	price = product.price - discount;

	if (product.vat && !store.isVatIncludedInPrice) {
		const productVatValue = (product.price * CONFIG.VAT) / 100;

		price += productVatValue;
	}
	return parseFloat(price.toFixed(2));
};
