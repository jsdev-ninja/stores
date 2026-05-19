import * as functions from "firebase-functions/v1";
import admin from "firebase-admin";

const TOKEN_REGEX = /^[A-Za-z0-9_-]{1,16}$/;

export const getPaymentRedirect = functions.https.onCall(
	async (data: { token: string }) => {
		try {
			const { token } = data;

			if (!token || typeof token !== "string" || !TOKEN_REGEX.test(token)) {
				return { success: false, error: "Invalid token" };
			}

			const doc = await admin
				.firestore()
				.collection("paymentRedirects")
				.doc(token)
				.get();

			if (!doc.exists) {
				return { success: false, error: "not_found" };
			}

			const record = doc.data() as {
				formAction: string;
				formFields: Record<string, string>;
				expiresAt: number;
			};

			if (record.expiresAt < Date.now()) {
				return { success: false, error: "expired" };
			}

			return {
				success: true,
				formAction: record.formAction,
				formFields: record.formFields,
			};
		} catch (error: any) {
			console.error("getPaymentRedirect error", error.message);
			return { success: false, error: error.message };
		}
	}
);
