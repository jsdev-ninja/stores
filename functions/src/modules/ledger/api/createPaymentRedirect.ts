import { TOrder } from "@jsdev_ninja/core";
import * as functions from "firebase-functions/v1";
import { hypPaymentService } from "../../../services/hypPaymentService";
import admin from "firebase-admin";
import { TStorePrivate } from "src/schema";
import * as crypto from "crypto";
import {
	buildFulfilledHeshDescItems,
	fitAmountToItemsSum,
} from "../internal/fulfilledHeshDescItems";

function isValidHttpUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

export const createPaymentRedirect = functions.https.onCall(
	async (data: { order: TOrder; isJ5?: boolean; origin?: string }) => {
		try {
			console.log("createPaymentRedirect called");
			console.log("createPaymentRedirect data", JSON.stringify(data));

			const { order, isJ5 = true, origin } = data;

			const storeId = order.storeId;
			console.log("storeId", storeId);

			const items = buildFulfilledHeshDescItems(order);

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
				console.error("createPaymentRedirect: hypPaymentService failed", res.errMessage);
				return {
					success: false,
					error: res.errMessage ?? "Failed to create payment link",
				};
			}

			const token = crypto.randomBytes(6).toString("base64url").slice(0, 8);

			const now = Date.now();
			await admin.firestore().collection("paymentRedirects").doc(token).set({
				token,
				formAction: res.formAction,
				formFields: res.formFields,
				orderId: order.id,
				storeId,
				companyId: (order as any).companyId ?? "",
				createdAt: now,
				expiresAt: now + 48 * 60 * 60 * 1000,
			});

			const baseOrigin =
				origin && isValidHttpUrl(origin) ? origin : "https://storebrix.com";
			const url = `${baseOrigin}/pay/${token}`;

			console.log("createPaymentRedirect: success", { token, url });

			return { success: true, url, token };
		} catch (error: any) {
			console.error("createPaymentRedirect error", error.message);
			return { success: false, error: error.message };
		}
	}
);
