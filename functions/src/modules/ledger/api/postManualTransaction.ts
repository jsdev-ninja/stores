import * as functions from "firebase-functions/v1";
import { logger } from "firebase-functions/v2";
import { z } from "zod";
import admin from "firebase-admin";
import { FirebaseAPI } from "@jsdev_ninja/core";
import { postTransaction } from "../services/postTransaction";

const InputSchema = z.object({
	/** Integer agorot */
	amount: z.number().int().positive(),
	idempotencyKey: z.string().min(1).max(200),
	reference: z
		.object({
			// "invoice" routes the transaction to a specific EZcount invoice.
			// The id is the EZcount doc_uuid of the invoice.
			type: z.enum(["order", "refund", "adjustment", "invoice"]),
			id: z.string().min(1),
		})
		.optional(),
	payer: z
		.object({
			// Accept null OR undefined from clients (forms often send null for
			// "no value"); we normalize to undefined before persisting below.
			organizationId: z.string().nullish(),
			clientId: z.string().nullish(),
			billingAccountId: z.string().nullish(),
		})
		.optional(),
});

/**
 * Verify that `invoiceUuid` (EZcount doc_uuid) belongs to the caller's tenant.
 *
 * Security invariant: a client must not be able to post a payment against an
 * invoice that belongs to a different company or store. We look up the order by
 * `ezInvoice.doc_uuid` within the caller's tenant-scoped collection path and
 * reject if no match is found.
 *
 * Returns the orderId when found, or null when the invoice does not belong to
 * this tenant (caller should reject with tenant_mismatch).
 */
async function verifyInvoiceBelongsToTenant(
	companyId: string,
	storeId: string,
	invoiceUuid: string,
): Promise<string | null> {
	const db = admin.firestore();
	const ordersPath = FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "orders",
	});

	// Try ezInvoice.doc_uuid first (primary — new EZcount flow).
	const ezSnap = await db
		.collection(ordersPath)
		.where("companyId", "==", companyId)
		.where("storeId", "==", storeId)
		.where("ezInvoice.doc_uuid", "==", invoiceUuid)
		.limit(1)
		.get();

	if (!ezSnap.empty) {
		return ezSnap.docs[0].id;
	}

	// Fallback: legacy o.invoice.id field (older stores).
	const legacySnap = await db
		.collection(ordersPath)
		.where("companyId", "==", companyId)
		.where("storeId", "==", storeId)
		.where("invoice.id", "==", invoiceUuid)
		.limit(1)
		.get();

	if (!legacySnap.empty) {
		return legacySnap.docs[0].id;
	}

	return null;
}

/**
 * Admin records an external money movement (cash, bank transfer, etc.).
 *
 * Auth: requires `admin` custom claim.
 * Tenant: companyId and storeId are derived exclusively from the auth token
 * claims — never from client-supplied input.
 */
export const postManualTransaction = functions.https.onCall(
	async (data: unknown, context) => {
		try {
			// Require admin custom claim
			if (!context.auth?.token.admin) {
				return { success: false, error: "Unauthorized" };
			}
			const uid = context.auth.uid;

			// Derive tenant from token claims — never trust client input for tenant
			const companyId = context.auth.token.companyId as string | undefined;
			const storeId = context.auth.token.storeId as string | undefined;

			if (!companyId || !storeId) {
				logger.error("ledger.postManualTransaction.missingTokenClaims", {
					uid,
					hasCompanyId: !!companyId,
					hasStoreId: !!storeId,
				});
				return { success: false, error: "missing_token_claims" };
			}

			const parsed = InputSchema.safeParse(data);
			if (!parsed.success) {
				logger.error("ledger.postManualTransaction.invalidInput", {
					uid,
					issues: parsed.error.issues,
				});
				return { success: false, error: "invalid_input" };
			}

			const input = parsed.data;

			// Security: when reference.type === "invoice", verify the invoice
			// belongs to the caller's tenant before posting any transaction.
			// This prevents a malicious admin from crediting their tenant's ledger
			// against an invoice that belongs to a different store/company.
			if (input.reference?.type === "invoice") {
				const orderId = await verifyInvoiceBelongsToTenant(
					companyId,
					storeId,
					input.reference.id,
				);
				if (!orderId) {
					logger.error("ledger.postManualTransaction.invoiceNotFound", {
						uid,
						invoiceUuid: input.reference.id,
						companyId,
						storeId,
					});
					return { success: false, error: "invoice_not_found" };
				}
			}

			// Normalize nullable payer fields to undefined — the downstream
			// Transaction schema uses optional (not nullable) strings.
			const payer = input.payer
				? {
						organizationId: input.payer.organizationId ?? undefined,
						clientId: input.payer.clientId ?? undefined,
						billingAccountId: input.payer.billingAccountId ?? undefined,
					}
				: undefined;

			const tx = await postTransaction({
				source: "api",
				idempotencyKey: input.idempotencyKey,
				actor: { type: "user", userId: uid },
				type: "manual",
				amount: input.amount,
				currency: "ILS",
				direction: "in",
				reference: input.reference,
				payer,
				companyId,
				storeId,
			});

			return { success: true, transactionId: tx.id };
		} catch (err: unknown) {
			logger.error("ledger.postManualTransaction.error", { err });
			return { success: false, error: "internal" };
		}
	},
);
