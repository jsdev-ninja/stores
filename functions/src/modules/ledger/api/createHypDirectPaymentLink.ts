import * as functions from "firebase-functions/v1";
import { logger } from "firebase-functions/v2";
import admin from "firebase-admin";
import { z } from "zod";
import { TStorePrivate } from "src/schema";
import { createPaymentLink } from "../services/createPaymentLink";

const InputSchema = z.object({
	orderId: z.string().min(1),
	/** Integer agorot */
	amountAgorot: z.number().int().positive(),
	origin: z.string().optional(),
	/** Optional client data passed through to HYP */
	clientName: z.string().optional(),
	clientLastName: z.string().optional(),
	email: z.string().optional(),
	cell: z.string().optional(),
	street: z.string().optional(),
	city: z.string().optional(),
	heshDesc: z.string().optional(),
});

/**
 * Admin creates a HYP direct payment link for an order.
 *
 * Auth: requires `admin` custom claim.
 * Tenant: companyId and storeId are derived exclusively from the auth token
 * claims — never from client-supplied input.
 */
export const createHypDirectPaymentLink = functions.https.onCall(
	async (data: unknown, context) => {
		try {
			// Require admin custom claim
			if (!context.auth?.token.admin) {
				return { success: false, error: "Unauthorized" };
			}
			const uid = context.auth.uid;

			// Derive tenant from token claims
			const companyId = context.auth.token.companyId as string | undefined;
			const storeId = context.auth.token.storeId as string | undefined;

			if (!companyId || !storeId) {
				logger.error(
					"ledger.createHypDirectPaymentLink.missingTokenClaims",
					{ uid, hasCompanyId: !!companyId, hasStoreId: !!storeId },
				);
				return { success: false, error: "missing_token_claims" };
			}

			const parsed = InputSchema.safeParse(data);
			if (!parsed.success) {
				logger.error("ledger.createHypDirectPaymentLink.invalidInput", {
					uid,
					issues: parsed.error.issues,
				});
				return { success: false, error: "invalid_input" };
			}

			const input = parsed.data;

			// Load store private credentials
			const storePrivateSnap = await admin
				.firestore()
				.collection(`STORES/${storeId}/private`)
				.doc("data")
				.get();

			if (!storePrivateSnap.exists) {
				logger.error(
					"ledger.createHypDirectPaymentLink.missingStoreConfig",
					{ uid, storeId },
				);
				return { success: false, error: "missing_store_config" };
			}

			const storePrivateData = storePrivateSnap.data() as TStorePrivate;

			// Convert agorot → shekels for HYP
			const amountShekels = (input.amountAgorot / 100).toFixed(2);

			const result = await createPaymentLink({
				companyId,
				storeId,
				orderId: input.orderId,
				amountAgorot: input.amountAgorot,
				origin: input.origin ?? "https://storebrix.com",
				hypParams: {
					action: "APISign",
					What: "SIGN",
					KEY: storePrivateData.hypData.KEY,
					PassP: storePrivateData.hypData.password,
					Masof: storePrivateData.hypData.masof,
					Sign: "True",
					Amount: amountShekels,
					J5: "False",
					MoreData: "True",
					Order: input.orderId,
					ClientName: input.clientName ?? "",
					ClientLName: input.clientLastName ?? "",
					email: input.email ?? "",
					cell: input.cell ?? "",
					street: input.street ?? "",
					city: input.city ?? "",
					UserId: "",
					phone: "",
					zip: "",
					Tash: "1",
					FixTash: "True",
					Info: input.orderId,
					UTF8: "True",
					UTF8out: "True",
					sendemail: "True",
					SendHesh: "True",
					heshDesc: input.heshDesc ?? "",
					Pritim: "True",
				},
			});

			return result;
		} catch (err: unknown) {
			logger.error("ledger.createHypDirectPaymentLink.error", { err });
			return { success: false, error: "internal" };
		}
	},
);
