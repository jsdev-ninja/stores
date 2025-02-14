import { hypPaymentService, TOrder, TProduct } from "@jsdev_ninja/core";
import * as functions from "firebase-functions/v1";
import admin from "firebase-admin";

// charge order for J5 transaction
export const chargeOrder = functions.https.onCall(
	async (data: { orderId: TOrder["id"] }, context) => {
		try {
			const { orderId } = data;

			console.log("context.auth?.token", context.auth?.token);
			console.log("orderId", orderId);

			const store = {} as any;

			const userId = context.auth?.uid;
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

			const payment = paymentDoc.data() as any;

			const transactionId = payment.payment?.id;

			if (!transactionId) {
				// todo
			}
			hypPaymentService.chargeJ5Transaction({
				action: "APISign",
			});
			console.log("token", token);
			return { success: true };
		} catch (error: any) {
			console.error(error.message);
			return null;
		}
	}
);
