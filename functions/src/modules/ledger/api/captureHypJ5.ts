import * as functions from "firebase-functions/v1";
import { logger } from "firebase-functions/v2";
import admin from "firebase-admin";
import { z } from "zod";
import { TStorePrivate } from "src/schema";
import { hypPaymentService } from "../../../services/hypPaymentService";
import { postTransaction } from "../services/postTransaction";
import {
	getTransactionById,
	queryCaptursByAuthTx,
} from "../internal/transactionsStore";

const InputSchema = z.object({
	/** The id of the hyp_j5_auth Transaction document */
	j5TransactionId: z.string().min(1),
	idempotencyKey: z.string().min(1).max(200),
});

/**
 * Admin captures a previously-authorized HYP J5 transaction.
 *
 * Auth: requires `admin` custom claim.
 * Tenant: companyId and storeId are derived exclusively from the auth token
 * claims — never from client-supplied input.
 *
 * Guards:
 * - Rejects if the referenced transaction is not of type hyp_j5_auth.
 * - Rejects if a successful hyp_capture already exists for this j5TransactionId
 *   (double-charge prevention — checked BEFORE the HYP API call).
 */
export const captureHypJ5 = functions.https.onCall(
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
				logger.error("ledger.captureHypJ5.missingTokenClaims", {
					uid,
					hasCompanyId: !!companyId,
					hasStoreId: !!storeId,
				});
				return { success: false, error: "missing_token_claims" };
			}

			const parsed = InputSchema.safeParse(data);
			if (!parsed.success) {
				logger.error("ledger.captureHypJ5.invalidInput", {
					uid,
					issues: parsed.error.issues,
				});
				return { success: false, error: "invalid_input" };
			}

			const input = parsed.data;

			// Load the original j5_auth transaction
			const authTx = await getTransactionById(
				companyId,
				storeId,
				input.j5TransactionId,
			);

			if (!authTx) {
				logger.error("ledger.captureHypJ5.authTxNotFound", {
					uid,
					j5TransactionId: input.j5TransactionId,
					companyId,
					storeId,
				});
				return { success: false, error: "auth_tx_not_found" };
			}

			if (authTx.type !== "hyp_j5_auth") {
				logger.error("ledger.captureHypJ5.wrongType", {
					uid,
					j5TransactionId: input.j5TransactionId,
					actualType: authTx.type,
				});
				return { success: false, error: "invalid_tx_type" };
			}

			if (!authTx.hyp?.paymentToken || !authTx.hyp?.masof) {
				logger.error("ledger.captureHypJ5.missingHypData", {
					uid,
					j5TransactionId: input.j5TransactionId,
				});
				return { success: false, error: "missing_hyp_data" };
			}

			// H1b — double-charge guard: check BEFORE the HYP API call
			const existingCaptures = await queryCaptursByAuthTx(
				companyId,
				storeId,
				input.j5TransactionId,
			);
			if (existingCaptures.length > 0) {
				logger.error("ledger.captureHypJ5.alreadyCaptured", {
					uid,
					j5TransactionId: input.j5TransactionId,
					existingCaptureIds: existingCaptures.map((t) => t.id),
				});
				return {
					success: false,
					error: "already_captured",
					existingTransactionId: existingCaptures[0]!.id,
				};
			}

			// Load store private credentials
			const storePrivateSnap = await admin
				.firestore()
				.collection(`STORES/${storeId}/private`)
				.doc("data")
				.get();

			if (!storePrivateSnap.exists) {
				logger.error("ledger.captureHypJ5.missingStoreConfig", {
					uid,
					storeId,
				});
				return { success: false, error: "missing_store_config" };
			}

			const storePrivateData = storePrivateSnap.data() as TStorePrivate;

			// Amount: agorot → shekels for HYP
			const amountShekels = (authTx.amount / 100).toFixed(2);

			// H1 — pull clientName/email from the original auth transaction
			const clientName = authTx.clientName ?? "";
			const email = authTx.email ?? "";

			const hypResult = await hypPaymentService.chargeJ5Transaction({
				transactionId: authTx.hyp.hypTransactionId ?? "",
				masof: storePrivateData.hypData.masof,
				masofPassword: storePrivateData.hypData.password,
				originalAmount: Number(amountShekels),
				actualAmount: Number(amountShekels),
				orderId: authTx.reference?.id ?? "",
				creditCardConfirmNumber: authTx.hyp.ccode ?? "",
				transactionUID: authTx.hyp.paymentToken,
				clientName,
				clientLastName: "",
				email,
				Pritim: "True",
			});

			if (!hypResult.success) {
				logger.error("ledger.captureHypJ5.hypFailed", {
					uid,
					j5TransactionId: input.j5TransactionId,
					errMessage: hypResult.errMessage,
					data: hypResult.data,
				});
				return {
					success: false,
					error: "hyp_capture_failed",
					errMessage: hypResult.errMessage,
				};
			}

			// HYP success — record the capture transaction
			const captureTx = await postTransaction({
				source: "api",
				idempotencyKey: input.idempotencyKey,
				actor: { type: "user", userId: uid },
				type: "hyp_capture",
				amount: authTx.amount,
				currency: "ILS",
				direction: "in",
				reference: authTx.reference,
				payer: authTx.payer,
				clientName,
				email,
				hyp: {
					masof: storePrivateData.hypData.masof,
					rawResponse: (hypResult.data as Record<string, unknown>) ?? {},
					capturedFromTransactionId: authTx.id,
				},
				companyId,
				storeId,
			});

			logger.info("ledger.captureHypJ5.success", {
				uid,
				j5TransactionId: input.j5TransactionId,
				captureTransactionId: captureTx.id,
				companyId,
				storeId,
			});

			return { success: true, transactionId: captureTx.id };
		} catch (err: unknown) {
			logger.error("ledger.captureHypJ5.error", { err });
			return { success: false, error: "internal" };
		}
	},
);
