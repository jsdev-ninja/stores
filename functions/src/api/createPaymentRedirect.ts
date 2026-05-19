import { TOrder, TStore } from "@jsdev_ninja/core";
import * as functions from "firebase-functions/v1";
import { hypPaymentService } from "../services/hypPaymentService";
import admin from "firebase-admin";
import { TStorePrivate } from "src/schema";
import crypto from "crypto";

// TODO: duplicate of fitAmountToItemsSum in createPayment.ts — factor out when refactoring payment params assembly
function fitAmountToItemsSum(amount: number, items: string[]): number {
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

// TODO: add admin role gating once role claims are propagated to auth tokens
export const createPaymentRedirect = functions.https.onCall(
	async (data: { order: TOrder; isJ5?: boolean; baseUrl: string }, context) => {
		try {
			functions.logger.info("createPaymentRedirect", { uid: context.auth?.uid, storeId: context.auth?.token?.storeId });

			const { order, isJ5 = true, baseUrl } = data;
			const storeId = order.storeId;

			const store: TStore = (
				await admin.firestore().collection(`STORES`).doc(storeId).get()
			).data() as TStore;

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
				cell: order.client?.phoneNumber ?? "",
				ClientName: nameOnInvoice ?? "",
				ClientLName: "",
				email: order.client?.email ?? "",
				street: order.client?.address?.street ?? "",
				city: order.client?.address?.city ?? "",
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

			if (!res.success || !res.formAction || !res.formFields) {
				return { success: false, error: res.errMessage ?? "failed to create payment link" };
			}

			const token = crypto.randomBytes(32).toString("base64url");
			const now = Date.now();
			const expiresAt = now + 48 * 3600 * 1000;

			await admin.firestore().collection("paymentRedirects").doc(token).set({
				formAction: res.formAction,
				formFields: res.formFields,
				expiresAt,
				createdAt: now,
				orderId: order.id,
				storeId,
				companyId: store.companyId ?? "",
				usedAt: null,
			});

			functions.logger.info("createPaymentRedirect success", { token, orderId: order.id, storeId });

			return { success: true, url: `${baseUrl}/pay/${token}`, token, expiresAt };
		} catch (error: any) {
			functions.logger.error("createPaymentRedirect error", { message: error.message });
			return { success: false, error: error.message };
		}
	}
);
