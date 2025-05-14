import { TDiscount, TProduct } from "@jsdev_ninja/core";
import { CONFIG } from "src/config";
import { TCart } from "src/domains/cart";

function calculateDiscount(product: TProduct) {
	if (product.discount?.type === "percent") {
		return (product.price * (product.discount.value ?? 100)) / 100;
	}
	if (product.discount?.type === "number") {
		return product.price - (product.discount.value ?? 0);
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

// main
export function getCartCost({ cart, discounts }: { cart: TCart["items"]; discounts: TDiscount[] }) {
	let result = cart.map((item) => {
		return {
			amount: item.amount,
			product: { ...item.product },
			originalPrice: item.product.price,
			finalPrice: item.product.price,
			finalDiscount: 0,
		};
	});

	const activeDiscounts = discounts.filter((discount) => {
		if (discount.variant.variantType === "bundle") {
			const productsTotal =
				cart?.reduce((total, item) => {
					if (discount.variant.productsId.includes(item.product.id)) {
						total += item.amount;
						return total;
					}
					return total;
				}, 0) ?? 0;
			if (productsTotal >= discount.variant.requiredQuantity) {
				// const times = Math.floor(productsTotal / discount.variant.requiredQuantity);
				// console.log("yes", times, discount.variant.discountPrice);
				return true;
			}
		}
		return false;
	});
	console.log("activeDiscounts", activeDiscounts);

	activeDiscounts.forEach((discount) => {
		if (discount.variant.variantType === "bundle") {
			// get all products in cart
			const products = cart.filter((item) =>
				discount.variant.productsId.includes(item.product.id)
			);
			const productsTotal =
				products?.reduce((total, item) => {
					if (discount.variant.productsId.includes(item.product.id)) {
						total += item.amount;
						return total;
					}
					return total;
				}, 0) ?? 0;

			const times = Math.floor(productsTotal / discount.variant.requiredQuantity);
			const price = getPriceAfterDiscount(products[0]?.product);
			const _discount = calculateDiscount(products[0]?.product);
			console.log("price", price, _discount);
			const discountPrice =
				Number(
					(discount.variant.discountPrice / discount.variant.requiredQuantity).toFixed(2)
				) * 1;

			console.log("discountPrice", discountPrice);
			const totalDiscount =
				(price * discount.variant.requiredQuantity - discount.variant.discountPrice) * times;

			const originalPrice = productsTotal * price;
			const discountPriceFinal = originalPrice - totalDiscount;

			console.log("totalDiscount", totalDiscount);

			console.log("discountPriceFinal", discountPriceFinal, originalPrice);

			const averagePrice = Number((discountPriceFinal / productsTotal).toFixed(2));

			result = result.map((item) => {
				if (discount.variant.productsId.includes(item.product.id)) {
					return {
						...item,
						finalPrice: averagePrice,
						originalPrice: item.product.price,
						finalDiscount: item.product.price - averagePrice,
					};
				}
				return item;
			});

			console.log("averagePrice", averagePrice);

			console.log(
				"yes",
				times,
				discount.variant.requiredQuantity,
				discount.variant.discountPrice
			);

			console.log("dis", productsTotal, products);

			// find average price
		}
	});

	console.log("result", result);

	const cartDetails = result.reduce(
		(acc, item) => {
			const { product, amount, finalPrice, finalDiscount, originalPrice } = item;
			console.log("originalPrice", originalPrice);

			let productVatValue: number = 0;
			if (product.vat) {
				productVatValue = (finalPrice * CONFIG.VAT) / 100;
				productVatValue = productVatValue * amount;
				acc.vat += +productVatValue.toFixed(2);
			}
			acc.cost += amount * finalPrice;
			acc.discount += finalDiscount ? amount * finalDiscount : finalDiscount;
			acc.finalCost += amount * finalDiscount + productVatValue;

			return acc;
		},
		{
			discount: 0,
			cost: 0,
			finalCost: 0,
			vat: 0,
		}
	);

	console.log("cartDetails", cartDetails);

	return { items: result, ...cartDetails };
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
