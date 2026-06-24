import * as functions from "firebase-functions/v1";
import { logger } from "firebase-functions/v2";
import admin from "firebase-admin";
import { z } from "zod";
import { TStorePrivate } from "src/schema";
import { verifyHypSignature } from "../services/verifyHypSignature";
import { postTransaction } from "../services/postTransaction";

const InputSchema = z.object({
	/** Tenant context the customer is shopping in — from the page context, not auth claims */
	companyId: z.string().min(1),
	storeId: z.string().min(1),
	/** HYP J5 redirect result fields (forwarded directly from the browser redirect) */
	Id: z.string().min(1),
	CCode: z.string().min(1),
	/** HYP Amount is in shekels (string from redirect params) */
	Amount: z.string().min(1),
	Order: z.string().min(1),
	ACode: z.string().optional(),
	Sign: z.string().optional(),
	/** Masof from the HYP redirect (cross-checked against store config) */
	Masof: z.string().min(1),
	/** J5 payment token (UID) for later capture */
	UID: z.string().min(1),
	last4: z.string().length(4).optional(),
	/** Client identity — reused by captureHypJ5 */
	clientName: z.string().max(200).optional(),
	email: z.string().email().max(254).optional(),
	reference: z.object({
		type: z.literal("order"),
		id: z.string().min(1),
	}),
	/** Full raw HYP response object for auditability */
	rawResponse: z.record(z.unknown()),
	payer: z
		.object({
			organizationId: z.string().optional(),
			clientId: z.string().optional(),
			billingAccountId: z.string().optional(),
		})
		.optional(),
});

/**
 * Customer-facing callable — records a HYP J5 authorization result from the browser.
 * No admin claim required; integrity is enforced by the HYP VERIFY call.
 *
 * Flow:
 *   1. Customer completes J5 auth on HYP UI → browser receives redirect params.
 *   2. Client calls this function with those params.
 *   3. Server calls HYP VERIFY — if invalid, reject with no write.
 *   4. Cross-check Masof matches store config.
 *   5. Write hyp_j5_auth transaction (amount from HYP, NOT client-supplied).
 *   6. Dedup key: hyp_{Id} — same HYP Id can't be recorded twice.
 */
export const recordHypJ5Auth = functions.https.onCall(
	async (data: unknown, context) => {
		try {
			const parsed = InputSchema.safeParse(data);
			if (!parsed.success) {
				logger.error("ledger.recordHypJ5Auth.invalidInput", {
					issues: parsed.error.issues,
				});
				return { success: false, error: "invalid_input" };
			}

			const input = parsed.data;

			// Load store private credentials to verify signature
			const storePrivateSnap = await admin
				.firestore()
				.collection(`STORES/${input.storeId}/private`)
				.doc("data")
				.get();

			if (!storePrivateSnap.exists) {
				logger.error("ledger.recordHypJ5Auth.missingStoreConfig", {
					storeId: input.storeId,
				});
				return { success: false, error: "missing_store_config" };
			}

			const storePrivateData = storePrivateSnap.data() as TStorePrivate;

			// Cross-check: the Masof in the HYP redirect must match the store's configured masof
			if (input.Masof !== storePrivateData.hypData.masof) {
				logger.error("ledger.recordHypJ5Auth.masofMismatch", {
					inputMasof: input.Masof,
					storeId: input.storeId,
				});
				return { success: false, error: "masof_mismatch" };
			}

			// HYP VERIFY — must pass before any write
			const verifyResult = await verifyHypSignature(
				{
					Id: input.Id,
					CCode: input.CCode,
					Amount: input.Amount,
					Order: input.Order,
					ACode: input.ACode,
					Sign: input.Sign,
					Masof: input.Masof,
				},
				{
					KEY: storePrivateData.hypData.KEY.trim(),
					PassP: storePrivateData.hypData.password.trim(),
					masof: storePrivateData.hypData.masof.trim(),
				},
			);

			if (!verifyResult.valid) {
				logger.error("ledger.recordHypJ5Auth.verifyFailed", {
					reason: verifyResult.reason,
					Id: input.Id,
					storeId: input.storeId,
				});
				return { success: false, error: "verify_failed" };
			}

			// Amount comes from HYP (verified), NOT from a separate client-supplied field
			// HYP Amount is in shekels — convert to integer agorot
			const amountAgorot = Math.round(parseFloat(input.Amount) * 100);
			if (amountAgorot <= 0 || !isFinite(amountAgorot)) {
				logger.error("ledger.recordHypJ5Auth.invalidAmount", {
					Amount: input.Amount,
					amountAgorot,
					Id: input.Id,
				});
				return { success: false, error: "invalid_amount" };
			}

			const tx = await postTransaction({
				source: "hyp_result",
				hypTransactionId: input.Id, // dedup key: hyp_{Id}
				// CCode "0" = the card was actually charged (direct payment), not a J5
				// hold — record it as hyp_direct so the order is marked paid, not left
				// at pending_j5. CCode "700" = real J5 authorization (awaiting capture).
				type: input.CCode === "0" ? "hyp_direct" : "hyp_j5_auth",
				amount: amountAgorot,
				currency: "ILS",
				direction: "in",
				reference: input.reference,
				payer: input.payer,
				clientName: input.clientName,
				email: input.email,
				hyp: {
					masof: storePrivateData.hypData.masof,
					paymentToken: input.UID,
					ccode: input.CCode,
					hypTransactionId: input.Id,
					last4: input.last4,
					rawResponse: input.rawResponse,
				},
				companyId: input.companyId,
				storeId: input.storeId,
			});

			return { success: true, transactionId: tx.id };
		} catch (err: unknown) {
			logger.error("ledger.recordHypJ5Auth.error", { err });
			return { success: false, error: "internal" };
		}
	},
);
