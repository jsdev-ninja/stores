import { TOrder, TStore } from "@jsdev_ninja/core";
import * as functions from "firebase-functions/v1";
import { hypPaymentService } from "../services/hypPaymentService";
import admin from "firebase-admin";
import { TStorePrivate } from "src/schema";

// Absorb tiny rounding drift between cart total and heshDesc items sum.
// HYP rejects (CCode=400) when items sum != Amount. We only auto-fix small drifts
// (≤ 0.20 ILS) to avoid masking real bugs.
function fitAmountToItemsSum(amount: number, items: string[]): number {
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

export const createPayment = functions.https.onCall(async (data: { order: TOrder, isJ5?: boolean }, context) => {
	try {
		console.log("createPayment", context);
		console.log("create payment data", JSON.stringify(data));

		const { order, isJ5 = true } = data;

		const storeId = order.storeId;
		console.log("storeId", storeId);

		const store: TStore = (
			await admin.firestore().collection(`STORES`).doc(storeId).get()
		).data() as TStore;

		// todo
		const VAT_RATE = 18;
		const DELIVERY_NAME = "משלוח";
		const isVatIncluded = order.storeOptions?.isVatIncludedInPrice ?? false;
		const postVatPrice = (base: number, hasVat: boolean) =>
			!isVatIncluded && hasVat ? base * (1 + VAT_RATE / 100) : base;
		const _items = order.cart.items;
		const items = _items.map((item) => {
			const price = postVatPrice(item.finalPrice ?? 0, !!item.product.vat).toFixed(2);
			const sku = (item.product.sku ?? "").trim();
			const name = (item.product.name[0]?.value ?? "").trim();
			return `[${sku}~${name}~${item.amount}~${price}]`;
		});
		if (order.cart.deliveryPrice) {
			items.push(`[0~${DELIVERY_NAME}~1~${order.cart.deliveryPrice.toFixed(2)}]`);
		}

		const storePrivateData: TStorePrivate = (
			await admin.firestore().collection(`STORES/${storeId}/private`).doc("data").get()
		).data() as TStorePrivate;

		console.log("storePrivateData", JSON.stringify(storePrivateData));

		const nameOnInvoice = order.nameOnInvoice;
		const adjustedAmount = fitAmountToItemsSum(order.cart.cartTotal, items);

		const res = await hypPaymentService.createPaymentLink({
			action: "APISign",
			What: "SIGN",
			KEY: storePrivateData.hypData.KEY,
			PassP: storePrivateData.hypData.password,
			Masof: storePrivateData.hypData.masof,
			Sign: "True",
			Amount: adjustedAmount.toString(),
			J5: isJ5 ? "True" : "False",
			MoreData: "True",
			Order: order.id,
			// client data
			cell: order.client?.phoneNumber ?? '',
			ClientName: nameOnInvoice ?? "",
			ClientLName: "",
			email: order.client?.email ?? '',
			street: order.client?.address?.street ?? '',
			city: order.client?.address?.city ?? '',
			UserId: "",
			phone: "",
			zip: "",
			Tash: "1",
			FixTash: "True",
			Info: order.id,
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
