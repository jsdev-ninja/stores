import * as functions from "firebase-functions/v1";
import admin from "firebase-admin";

// Anyone with a valid token can resolve — the token IS the capability. Do not add role gating.
export const getPaymentRedirect = functions.https.onCall(
	async (data: { token: string }, _context) => {
		try {
			const { token } = data;

			const snap = await admin.firestore().collection("paymentRedirects").doc(token).get();

			if (!snap.exists) {
				return { success: false, error: "not_found" };
			}

			const doc = snap.data()!;

			if (Date.now() > doc.expiresAt) {
				return { success: false, error: "expired" };
			}

			// fire-and-forget: stamp first use without blocking the response
			if (doc.usedAt === null) {
				snap.ref.update({ usedAt: Date.now() }).catch(() => {});
			}

			return {
				success: true,
				formAction: doc.formAction as string,
				formFields: doc.formFields as Record<string, string>,
			};
		} catch (error: any) {
			functions.logger.error("getPaymentRedirect error", { message: error.message });
			return { success: false, error: "internal" };
		}
	}
);
