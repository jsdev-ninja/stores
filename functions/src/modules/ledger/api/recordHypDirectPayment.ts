import * as functions from "firebase-functions/v1";
import { logger } from "firebase-functions/v2";
import admin from "firebase-admin";
import { z } from "zod";
import { FirebaseAPI, TOrder } from "@jsdev_ninja/core";
import { TStorePrivate } from "src/schema";
import { verifyHypSignature } from "../services/verifyHypSignature";
import { validateAndConsumeLink } from "../services/validateAndConsumeLink";
import { postTransaction } from "../services/postTransaction";
import { getPaymentLinkByToken } from "../internal/paymentLinksStore";

const InputSchema = z.object({
	/** Payment link token — identifies which link was used */
	token: z.string().min(1),
	/** Tenant context (must match the link's companyId/storeId) */
	companyId: z.string().min(1),
	storeId: z.string().min(1),
	/** HYP direct payment redirect result fields */
	Id: z.string().min(1),
	CCode: z.string().min(1),
	/** HYP Amount in shekels (string from redirect params) */
	Amount: z.string().min(1),
	Order: z.string().min(1),
	ACode: z.string().optional(),
	Sign: z.string().optional(),
	/** Masof from HYP redirect (cross-checked against store config) */
	Masof: z.string().min(1),
	/** Full raw HYP response object for auditability */
	rawResponse: z.record(z.unknown()),
});

/**
 * Customer-facing callable — records the result of a HYP direct payment link.
 * Called after the customer pays via a payment link and is redirected back.
 * No admin claim required; integrity enforced by HYP VERIFY + link consumption.
 *
 * Flow:
 *   1. Admin creates a payment link via createHypDirectPaymentLink.
 *   2. Customer pays on HYP UI → browser redirected back with result params.
 *   3. Client calls this function with those params + the link token.
 *   4. Server calls HYP VERIFY — if invalid, reject with no write.
 *   5. Cross-check Masof.
 *   6. Write hyp_direct transaction (idempotent on hyp_{Id}) — money fact is durable.
 *   7. Atomically consume the single-use link (validateAndConsumeLink).
 *      If consume fails AFTER record succeeds, we still return success with the
 *      recorded transactionId — the money fact is not lost. Consume failure is
 *      logged as a warning; idempotent retry is safe.
 *   8. Dedup key: hyp_{Id} — same HYP Id can't be recorded twice.
 */
export const recordHypDirectPayment = functions.https.onCall(
	async (data: unknown, _context) => {
		try {
			const parsed = InputSchema.safeParse(data);
			if (!parsed.success) {
				logger.error("ledger.recordHypDirectPayment.invalidInput", {
					issues: parsed.error.issues,
				});
				return { success: false, error: "invalid_input" };
			}

			const input = parsed.data;

			// Load store private credentials for VERIFY
			const storePrivateSnap = await admin
				.firestore()
				.collection(`STORES/${input.storeId}/private`)
				.doc("data")
				.get();

			if (!storePrivateSnap.exists) {
				logger.error("ledger.recordHypDirectPayment.missingStoreConfig", {
					storeId: input.storeId,
				});
				return { success: false, error: "missing_store_config" };
			}

			const storePrivateData = storePrivateSnap.data() as TStorePrivate;

			// Cross-check: Masof in redirect must match store config
			if (input.Masof !== storePrivateData.hypData.masof) {
				logger.error("ledger.recordHypDirectPayment.masofMismatch", {
					inputMasof: input.Masof,
					storeId: input.storeId,
				});
				return { success: false, error: "masof_mismatch" };
			}

			// HYP VERIFY — must pass before any write or link consumption
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
				logger.error("ledger.recordHypDirectPayment.verifyFailed", {
					reason: verifyResult.reason,
					Id: input.Id,
					storeId: input.storeId,
				});
				return { success: false, error: "verify_failed" };
			}

			// Peek at the link (read-only) to validate tenant context BEFORE writing the
			// transaction, so we don't record money for the wrong tenant.
			// The authoritative single-use enforcement happens in the transactional consume below.
			const linkSnapshot = await getPaymentLinkByToken(input.token);

			if (!linkSnapshot) {
				logger.error("ledger.recordHypDirectPayment.linkNotFound", {
					token: input.token,
					Id: input.Id,
				});
				return { success: false, error: "link_not_found" };
			}

			if (linkSnapshot.expiresAt < Date.now()) {
				logger.error("ledger.recordHypDirectPayment.linkExpired", {
					token: input.token,
					Id: input.Id,
				});
				return { success: false, error: "link_expired" };
			}

			// Validate tenant context matches the link before any write
			if (
				linkSnapshot.companyId !== input.companyId ||
				linkSnapshot.storeId !== input.storeId
			) {
				logger.error("ledger.recordHypDirectPayment.tenantMismatch", {
					linkCompanyId: linkSnapshot.companyId,
					linkStoreId: linkSnapshot.storeId,
					inputCompanyId: input.companyId,
					inputStoreId: input.storeId,
				});
				return { success: false, error: "tenant_mismatch" };
			}

			// Amount comes from HYP (verified), NOT from a separately client-supplied field
			const amountAgorot = Math.round(parseFloat(input.Amount) * 100);
			if (amountAgorot <= 0 || !isFinite(amountAgorot)) {
				logger.error("ledger.recordHypDirectPayment.invalidAmount", {
					Amount: input.Amount,
					amountAgorot,
					Id: input.Id,
				});
				return { success: false, error: "invalid_amount" };
			}

			// Resolve payer.organizationId from the order so the budget subscriber
			// can reduce org debt without an extra read.
			//
			// Security: for order-type references, we MUST successfully resolve the
			// org context. Proceeding without it means debt would never be reduced for
			// B2B payments. Fail closed (throw) so the caller retries.
			// For non-order references, best-effort is acceptable (no budget impact).
			let payerOrganizationId: string | undefined;
			let payerClientId: string | undefined;
			let payerBillingAccountId: string | undefined;

			if (linkSnapshot.reference.type === "order") {
				const orderPath = FirebaseAPI.firestore.getPath({
					companyId: input.companyId,
					storeId: input.storeId,
					collectionName: "orders",
					id: linkSnapshot.reference.id,
				});
				// Do NOT wrap in try/catch — let network/Firestore errors propagate so
				// the caller retries. A missing doc (exists === false) also fails closed.
				const orderSnap = await admin.firestore().doc(orderPath).get();
				if (!orderSnap.exists) {
					logger.error("ledger.recordHypDirectPayment.orderNotFound", {
						orderId: linkSnapshot.reference.id,
						companyId: input.companyId,
						storeId: input.storeId,
						Id: input.Id,
					});
					// Throw so the function retries; the HYP charge is already recorded
					// idempotently so retrying is safe.
					throw new Error(
						`recordHypDirectPayment: order doc not found for orderId=${linkSnapshot.reference.id} — will retry`,
					);
				}
				const order = orderSnap.data() as TOrder;
				payerOrganizationId = order.organizationId;
				payerClientId = order.client?.id;
				payerBillingAccountId = order.billingAccount?.id;
			}

			// STEP 1 (priority): Record the money fact — idempotent on hyp_{Id}.
			// The HYP charge already happened before this function runs; recording it
			// is the durable, highest-priority action. On a browser replay, postTransaction
			// returns the existing tx (idempotent no-op) and we proceed.
			const tx = await postTransaction({
				source: "hyp_result",
				hypTransactionId: input.Id, // dedup key: hyp_{Id}
				type: "hyp_direct",
				amount: amountAgorot,
				currency: "ILS",
				direction: "in",
				reference: linkSnapshot.reference,
				payer: {
					organizationId: payerOrganizationId,
					clientId: payerClientId,
					billingAccountId: payerBillingAccountId,
				},
				hyp: {
					masof: storePrivateData.hypData.masof,
					ccode: input.CCode,
					hypTransactionId: input.Id,
					rawResponse: input.rawResponse,
				},
				companyId: input.companyId,
				storeId: input.storeId,
			});

			// STEP 2 (secondary): Consume the single-use link.
			// If this fails after a successful record, the money fact is already durable —
			// return success with the transactionId and log the issue for ops follow-up.
			// On retry, postTransaction (step 1) is idempotent; consume returning
			// already_used is acceptable.
			const consumeResult = await validateAndConsumeLink(input.token);
			if (!consumeResult.success) {
				if (consumeResult.reason === "already_used") {
					// Idempotent replay — the link was already consumed (likely a browser retry).
					// The transaction was recorded (idempotently) above; this is normal.
					logger.info("ledger.recordHypDirectPayment.linkAlreadyUsed", {
						token: input.token,
						reason: consumeResult.reason,
						Id: input.Id,
						transactionId: tx.id,
					});
				} else {
					// Consume failed after a successful record — money fact is safe.
					// Log as a warning for ops; do NOT surface as a failure to the client
					// since the transaction was recorded successfully.
					logger.warn("ledger.recordHypDirectPayment.consumeFailedAfterRecord", {
						token: input.token,
						reason: consumeResult.reason,
						Id: input.Id,
						transactionId: tx.id,
					});
				}
			}

			logger.info("ledger.recordHypDirectPayment.success", {
				Id: input.Id,
				transactionId: tx.id,
				companyId: input.companyId,
				storeId: input.storeId,
				token: input.token,
				amountAgorot,
			});

			return { success: true, transactionId: tx.id };
		} catch (err: unknown) {
			logger.error("ledger.recordHypDirectPayment.error", { err });
			return { success: false, error: "internal" };
		}
	},
);
