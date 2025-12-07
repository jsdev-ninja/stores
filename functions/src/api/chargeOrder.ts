import { TOrder, FirebaseAPI } from "@jsdev_ninja/core";
import * as functions from "firebase-functions/v1";
import admin from "firebase-admin";
import { TPayProtocolResponse, TStorePrivate } from "src/schema";
import { hypPaymentService } from "../services/hypPaymentService";

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

		const _items = order.cart.items;
		const items = _items.map(
			(item) =>
				`[${item.product.sku}~${item.product.name[0].value}~${item.amount}~${item.finalPrice}]`
		);

		const [clientName, clientLastName] = (payment.payment.Fild1 ?? "").split(" ");
		const res = await hypPaymentService.chargeJ5Transaction({
			actualAmount: order.cart.cartTotal.toFixed(2) as any, // todo
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
			Pritim: "False",
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
						paymentStatus: "completed", // TODO,
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
