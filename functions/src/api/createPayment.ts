import { TOrder, TProduct } from "@jsdev_ninja/core";
import * as functions from "firebase-functions/v1";
// import admin from "firebase-admin";
function objectToQueryParams(obj: any) {
	return Object.keys(obj)
		.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
		.join("&");
}

const getProductFinalPrice = (product: TProduct) => {
	if (!product) return 0;
	const hasDiscount = product.discount.type !== "none";

	const discount = hasDiscount
		? product.discount.type === "number"
			? product.discount.value
			: (product.price * product.discount.value) / 100
		: 0;

	console.log("discount", discount);

	let price = 0;

	price = product.price - discount;

	if (product.vat) {
		const productVatValue = (product.price * 18) / 100;
		console.log("productVatValue", productVatValue, price);

		price += productVatValue;
	}
	return parseFloat(price.toFixed(2));
};

// HYP BUGS
// 1) success pay twice on same order
// 2) F5 not works

// 5326105300985614
// 12/25
// 125
// 890108566
export const createPayment = functions.https.onCall(async (data: { order: TOrder }, context) => {
	try {
		console.log("createPayment", context.rawRequest.headers.origin);
		console.log("create payment data", JSON.stringify(data));

		const { order } = data;
		const items = order.cart.items.map(
			(item) =>
				`[${item.product.sku}~${item.product.name[0].value}~${
					item.amount
				}~${getProductFinalPrice(item.product)}]`
		);

		const systemParams = {};
		const storeParams = {
			MoreData: "True",
			J5: "True",
			sendemail: "True",
		};
		const clientParams = {};
		const unknowParams = {};

		const params = {
			PassP: "hyp1234",
			KEY: "81057eb786ffc379de89d860031e8fea0e4d28f2",
			Masof: "0010302921",
			action: "APISign",
			What: "SIGN",
			Order: order.id, //?
			Info: "test-api", //?
			Amount: order.cart.cartTotal,
			UTF8: "True",
			UTF8out: "True",
			UserId: "203269535",
			ClientName: "Israel",
			ClientLName: "Isareli",
			street: "levanon+3",
			city: "netanya",
			zip: "42361",
			phone: "098610338",
			cell: "050555555555", //?
			email: "test@yaad.net",
			Tash: "1", //?
			FixTash: "False",
			ShowEngTashText: "False",
			Coin: "1", //?
			Postpone: "False",

			SendHesh: "True",
			heshDesc: items.join(""),
			Pritim: "True",

			PageLang: "HEB",
			tmp: "1",
			Sign: "True",
			...storeParams,
		};

		const queryString = objectToQueryParams(params);

		const url = `https://pay.hyp.co.il/p/?${queryString}`;
		console.log(queryString);

		const res = await fetch(url);
		const body = await res.text();
		return {
			paymentLink: `https://pay.hyp.co.il/p/?action=pay&${body}`,
		};
	} catch (error: any) {
		console.error(error.message);
		return null;
	}
});
