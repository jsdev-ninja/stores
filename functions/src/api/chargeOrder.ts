import { hypPaymentService, TOrder, TPayProtocolResponse } from "@jsdev_ninja/core";
import * as functions from "firebase-functions/v1";
import admin from "firebase-admin";

// charge order for J5 transaction
export const chargeOrder = functions.https.onCall(
	async (data: { orderId: TOrder["id"] }, context) => {
		try {
			const { orderId } = data;

			console.log("context.auth?.token", context.auth?.token);
			console.log("orderId", orderId);

			// const store = {} as any;

			// const userId = context.auth?.uid;
			// check if user admin
			// check if user store id === order store id

			const orderDoc = await admin.firestore().collection("orders").doc(orderId).get();

			if (!orderDoc.exists) {
				// todo return err
			}

			const order = orderDoc.data() as TOrder;

			const paymentDoc = await admin.firestore().collection("payments").doc(orderId).get();

			if (!paymentDoc.exists) {
				// todo return err
			}

			const payment = paymentDoc.data() as { payment: TPayProtocolResponse };

			const transactionId = payment.payment?.Id;

			if (!transactionId) {
				// todo
			}
			await hypPaymentService.chargeJ5Transaction({
				actualAmount: order.cart.cartTotal,
				originalAmount: order.cart.cartTotal,
				creditCardConfirmNumber: payment.payment.ACode,
				masof: "0010302921",
				masofPassword: "hyp1234",
				orderId: order.id,
				transactionId: payment.payment.Id,
				transactionUID: payment.payment.UID ?? "",
			});
			console.log("chargeJ5Transaction success");
			return { success: true };
		} catch (error: any) {
			console.error(error.message);
			return null;
		}
	}
);
