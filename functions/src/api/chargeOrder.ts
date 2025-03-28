import { TOrder, FirebaseAPI } from "@jsdev_ninja/core";
import * as functions from "firebase-functions/v1";
import admin from "firebase-admin";
import { TPayProtocolResponse } from "src/schema";
import { hypPaymentService } from "../services/hypPaymentService";

// charge order for J5 transaction
export const chargeOrder = functions.https.onCall(
	async (data: { orderId: TOrder["id"] }, context) => {
		try {
			const { orderId } = data;

			console.log("context.auth?.uid", context.auth?.uid);
			console.log("context.auth?.token", context.auth?.token.storeId);
			console.log("orderId", orderId);

			// const store = {} as any;

			// const userId = context.auth?.uid;
			// check if user admin
			// check if user store id === order store id

			const orderDoc = await admin
				.firestore()
				.collection(
					FirebaseAPI.firestore.getPath({
						collectionName: "orders",
						companyId: "tester_company",
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
						companyId: "tester_company",
						storeId: context.auth?.token.storeId ?? "",
					})
				)
				.doc(orderId)
				.get();

			console.log("paymentDoc", order, paymentDoc.id, paymentDoc.exists);

			if (!paymentDoc.exists) {
				// todo return err
				return;
			}

			const payment = paymentDoc.data() as { payment: TPayProtocolResponse };

			const transactionId = payment.payment?.Id;

			if (!transactionId) {
				// todo
			}

			const [clientName, clientLastName] = (payment.payment.Fild1 ?? "").split(" ");
			const res = await hypPaymentService.chargeJ5Transaction({
				actualAmount: (order.cart.cartTotal).toFixed(2) as any, // todo
				originalAmount: order.cart.cartTotal.toFixed(2) as any,
				creditCardConfirmNumber: payment.payment.ACode,
				masof: "0010302921",
				masofPassword: "hyp1234",
				orderId: order.id,
				transactionId: payment.payment.Id,
				transactionUID: payment.payment.UID ?? "",
				clientName,
				clientLastName,
			});
			if (res.success) {
				await admin
					.firestore()
					.collection(
						FirebaseAPI.firestore.getPath({
							collectionName: "orders",
							companyId: "tester_company",
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
				console.log("order completed");
			}
			console.log("chargeJ5Transaction success");
			return { success: true };
		} catch (error: any) {
			console.error(error.message);
			return null;
		}
	}
);
