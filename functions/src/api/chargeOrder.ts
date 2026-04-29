import { TOrder, FirebaseAPI } from "@jsdev_ninja/core";
import * as functions from "firebase-functions/v1";
import admin from "firebase-admin";
import { TPayProtocolResponse, TStorePrivate } from "src/schema";
import { hypPaymentService } from "../services/hypPaymentService";

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
	console.log('PPPPPPPPPP',diff, amount, itemsSum);
	if (diff > 0 && diff <= 0.2) {
		return itemsSum;
	}
	return amount;
}

// charge order for J5 transaction
export const chargeOrder = functions.https.onCall(async (data: { order: TOrder }, context) => {
	try {
		const orderId = data.order.id;
		const storeId = data.order.storeId;

		console.log("context.auth?.uid", context.auth?.uid);
		console.log("context.auth?.token", context.auth?.token.storeId);
		console.log("orderId", orderId);

		const storePrivateData: TStorePrivate = (
			await admin.firestore().collection(`STORES/${storeId}/private`).doc("data").get()
		).data() as TStorePrivate;

		// const store = {} as any;

		// const userId = context.auth?.uid;
		// check if user admin
		// check if user store id === order store id

		const orderDoc = await admin
			.firestore()
			.collection(
				FirebaseAPI.firestore.getPath({
					collectionName: "orders",
					companyId: data.order.companyId,
					storeId: context.auth?.token.storeId ?? "",
				})
			)
			.doc(orderId)
			.get();

		if (!orderDoc.exists) {
			// todo return err
		}

		const order = orderDoc.data() as TOrder;

		const paymentDoc = await admin
			.firestore()
			.collection(
				FirebaseAPI.firestore.getPath({
					collectionName: "payments",
					companyId: order.companyId,
					storeId: context.auth?.token.storeId ?? "",
				})
			)
			.doc(orderId)
			.get();

		if (!paymentDoc.exists) {
			// todo return err
			console.log("paymentDoc.exists!!!!!!");

			return;
		}

		const payment = paymentDoc.data() as { payment: TPayProtocolResponse };

		const transactionId = payment.payment?.Id;

		if (!transactionId) {
			// todo
		}

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

		const adjustedAmount = fitAmountToItemsSum(order.cart.cartTotal, items);

		const [clientName, clientLastName] = (payment.payment.Fild1 ?? "").split(" ");
		const res = await hypPaymentService.chargeJ5Transaction({
			actualAmount: adjustedAmount as any,
			originalAmount: Number(payment.payment.Amount).toFixed(2) as any,
			creditCardConfirmNumber: payment.payment.ACode,
			masof: storePrivateData.hypData.masof,
			masofPassword: storePrivateData.hypData.password,
			orderId: order.id,
			transactionId: payment.payment.Id,
			transactionUID: payment.payment.UID ?? "",
			clientName: order?.nameOnInvoice || clientName,
			clientLastName,
			email: order.client?.email ?? "",
			heshDesc: items.join(""),
			Pritim: "True",
		});
		if (res.success) {
			await admin
				.firestore()
				.collection(
					FirebaseAPI.firestore.getPath({
						collectionName: "orders",
						companyId: data.order.companyId,
						storeId: context.auth?.token.storeId ?? "",
					})
				)
				.doc(orderId)
				.set(
					{
						paymentStatus: "completed",
						status: "completed",
					},
					{ merge: true }
				);

			await admin
				.firestore()
				.collection(
					FirebaseAPI.firestore.getPath({
						collectionName: "payments",
						companyId: data.order.companyId,
						storeId: context.auth?.token.storeId ?? "",
					})
				)
				.doc(orderId + "_charged")
				.set(res.data, { merge: true });
			console.log("order completed");
			console.log("chargeJ5Transaction success");
		}
		return { success: true };
	} catch (error: any) {
		console.error(error.message);
		return null;
	}
});
