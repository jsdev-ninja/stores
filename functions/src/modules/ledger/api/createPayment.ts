import { TOrder } from "@jsdev_ninja/core";
import * as functions from "firebase-functions/v1";
import { hypPaymentService } from "../../../services/hypPaymentService";
import admin from "firebase-admin";
import { TStorePrivate } from "src/schema";

// HYP/EzCount recomputes each heshDesc line as `qty × price`, rounds it the way
// the raw float naturally rounds (= toFixed(2)), then sums. `Amount` MUST equal
// that sum exactly or HYP rejects with CCode=400 ("סכום הפריטים אינו תואם לסכום לחיוב").
//
// We derive Amount from the SAME per-line toFixed rounding HYP uses — NOT Math.round
// (rounds half-agora line totals up) and NOT the raw unrounded float (e.g. 1.45 × 15.90 =
// 23.0549… stays a long float, never equals HYP's 2dp line). Both diverge by an agora.
function sumHeshDescItems(items: string[]): number {
	const itemsSum = items.reduce((sum, line) => {
		const m = line.match(/~([\d.]+)~([\d.]+)\]$/);
		if (!m) return sum;
		return sum + Number((parseFloat(m[1]) * parseFloat(m[2])).toFixed(2));
	}, 0);
	return Number(itemsSum.toFixed(2));
}

export const createPayment = functions.https.onCall(async (data: { order: TOrder, isJ5?: boolean }, context) => {
	try {
		functions.logger.info("createPayment: start", { uid: context.auth?.uid, isJ5: data.isJ5 ?? false });
		functions.logger.info("createPayment: order received", { orderId: data.order?.id, storeId: data.order?.storeId, companyId: data.order?.companyId });

		const { order, isJ5 = true } = data;

		const storeId = order.storeId;
		functions.logger.info("createPayment: store", { storeId });

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

		// storePrivateData intentionally NOT logged — contains HYP credentials and secrets

		const nameOnInvoice = order.nameOnInvoice;
		// Amount sent to HYP must equal HYP's own sum of the heshDesc lines.
		const adjustedAmount = sumHeshDescItems(items);

		const res = await hypPaymentService.createPaymentLink({
			action: "APISign",
			What: "SIGN",
			KEY: storePrivateData.hypData.KEY,
			PassP: storePrivateData.hypData.password,
			Masof: storePrivateData.hypData.masof,
			Sign: "True",
			Amount: adjustedAmount.toFixed(2),
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
			formAction: res.formAction,
			formFields: res.formFields,
		};
	} catch (error: any) {
		functions.logger.error("createPayment: failed", { message: error.message });
		return null;
	}
});
