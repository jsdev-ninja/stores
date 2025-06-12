import { TOrder, TStore } from "@jsdev_ninja/core";
import * as functions from "firebase-functions/v1";
import { hypPaymentService } from "../services/hypPaymentService";
import admin from "firebase-admin";
import { TStorePrivate } from "src/schema";

export const createPayment = functions.https.onCall(async (data: { order: TOrder }, context) => {
	try {
		console.log("createPayment", context.rawRequest.headers.origin);
		console.log("create payment data", JSON.stringify(data));

		const { order } = data;

		const storeId = order.storeId;
		console.log("storeId", storeId);

		const store: TStore = (
			await admin.firestore().collection(`STORES`).doc(storeId).get()
		).data() as TStore;

		// todo
		const _items = order.cart.items;
		const items = _items.map(
			(item) =>
				`[${item.product.sku}~${item.product.name[0].value}~${item.amount}~${item.finalPrice}]`
		);

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
			ClientName: order?.nameOnInvoice || order.client.displayName,
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
			Pritim: "False",
		});

		return {
			paymentLink: res.paymentLink,
		};
	} catch (error: any) {
		console.error(error.message);
		return null;
	}
});
