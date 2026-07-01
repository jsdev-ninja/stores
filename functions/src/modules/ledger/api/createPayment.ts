import { TOrder } from "@jsdev_ninja/core";
import * as functions from "firebase-functions/v1";
import { hypPaymentService } from "../../../services/hypPaymentService";
import admin from "firebase-admin";
import { TStorePrivate } from "src/schema";
import {
	buildFulfilledHeshDescItems,
	sumHeshDescItems,
} from "../internal/fulfilledHeshDescItems";

export const createPayment = functions.https.onCall(async (data: { order: TOrder, isJ5?: boolean }, context) => {
	try {
		functions.logger.info("createPayment: start", { uid: context.auth?.uid, isJ5: data.isJ5 ?? false });
		functions.logger.info("createPayment: order received", { orderId: data.order?.id, storeId: data.order?.storeId, companyId: data.order?.companyId });

		const { order, isJ5 = true } = data;

		const storeId = order.storeId;
		functions.logger.info("createPayment: store", { storeId });

		const items = buildFulfilledHeshDescItems(order);

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
