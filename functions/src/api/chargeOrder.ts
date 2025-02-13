import { TOrder, TProduct } from "@jsdev_ninja/core";
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
			const token = await createToken({
				TransId: transactionId,
				PassP: store.hypPassword,
				Masof: store.hypMasof,
			});
			console.log("token", token);
		} catch (error: any) {
			console.error(error.message);
			return null;
		}
	}
);

async function createToken({ TransId, PassP, Masof }: any) {
	try {
		const params = {
			action: "getToken",
			allowTrueFalse: "True",
			PassP,
			Masof,
			TransId: TransId,
		};

		const queryString = new URLSearchParams(params).toString();

		// API URL
		const apiUrl = `https://pay.hyp.co.il/p/?${queryString}`;

		const response = await fetch(apiUrl, {
			method: "GET",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		});

		if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

		const data = await response.text();

		return data;
	} catch (error: any) {
		console.error("Error:", error.message);
	}
}

async function softTransaction() {
	try {
		const params = {
			PassP: "hyp1234",
			Masof: "0010302921",
			action: "soft",
			"inputObj.originalUid": "25021216040808822865758",
			"inputObj.originalAmount": "900",
			"inputObj.authorizationCodeManpik": "7",
			AuthNum: "0012345",
			Amount: "100",
			CC: "3688405320412205614",
			Tmonth: "12",
			Tyear: "25",
			Coin: "1",
			Info: "test-api9",
			Order: "12345678910",
			Tash: "1",
			UserId: "203269535",
			ClientLName: "Israeli",
			ClientName: "Israel",
			cell: "050555555555",
			phone: "098610338",
			city: "netanya",
			email: "philipbrodovsky@gmail.com",
			street: "levanon 3",
			zip: "42361",
			J5: "False",
			MoreData: "True",
			Postpone: "false",
			Pritim: "True",
			SendHesh: "True",
			heshDesc: "[0~Item 1~1~8][0~Item 2~2~1]",
			sendemail: "True",
			UTF8: "True",
			UTF8out: "True",
			Fild1: "freepram",
			Fild2: "freepram",
			Fild3: "freepram",
			Token: "True",
		};

		const queryString = new URLSearchParams(params).toString();
		console.log("queryString", queryString);

		// API URL
		const apiUrl = `https://pay.hyp.co.il/cgi-bin/yaadpay/yaadpay3ds.pl?${queryString}`;
		// const apiUrl = `https://pay.hyp.co.il/p/?${queryString}`;

		const response = await fetch(apiUrl, {
			method: "GET",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		});

		if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

		const data = await response.text(); // Assuming response is text, change to `.json()` if needed
		console.log(data);
		return data;
	} catch (error: any) {
		console.error("Error:", error.message);
	}
}
