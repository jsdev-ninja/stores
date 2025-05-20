import { TOrder, TProduct } from "@jsdev_ninja/core";
import * as functions from "firebase-functions/v1";
import { hypPaymentService } from "../services/hypPaymentService";
import admin from "firebase-admin";
import { TStorePrivate } from "src/schema";

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

		const storeId = order.storeId;
		console.log("storeId", storeId);

		const storePrivateData: TStorePrivate = (
			await admin.firestore().collection(`STORES/${storeId}/private`).doc("data").get()
		).data() as TStorePrivate;

		console.log("storePrivateData", JSON.stringify(storePrivateData));

		const res = await hypPaymentService.createPaymentLink({
			action: "APISign",
			What: "SIGN",
			KEY: storePrivateData.hypData.KEY,
			PassP: storePrivateData.hypData.password,
			Masof: storePrivateData.hypData.masof,
			Sign: "True",
			Amount: order.cart.cartTotal.toString(),
			J5: "True",
			MoreData: "True",
			Order: order.id,
			// client data
			cell: order.client.phoneNumber,
			ClientName: order.client.displayName,
			ClientLName: order.client.displayName,
			email: order.client.email,
			street: order.client.address?.street,
			city: order.client.address?.city,
			UserId: "",
			phone: "",
			zip: "",
			Tash: "1",
			FixTash: "True",
			Info: "balasi store",
			UTF8: "True",
			UTF8out: "True",
			sendemail: "True",
			SendHesh: "True",
			heshDesc: items.join(""),
			Pritim: "True",
		});

		return {
			paymentLink: res.paymentLink,
		};
	} catch (error: any) {
		console.error(error.message);
		return null;
	}
});
