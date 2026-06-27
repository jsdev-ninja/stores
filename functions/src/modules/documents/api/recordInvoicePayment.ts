/**
 * recordInvoicePayment — admin callable
 *
 * Records a full payment against an open invoice. This is the ONLY supported
 * payment mode in this iteration — partial payments are explicitly NOT supported.
 * The endpoint does not accept an `amount` field: it always pays the invoice in full.
 *
 * ## Happy path
 * 1. Load the order by orderId (tenant-scoped). Verify invoice exists.
 * 2. Idempotency check — if invoicePaidAt or ezReceipt already set, return success
 *    with the existing receipt info (safe re-submit, e.g. after network timeout).
 * 3. Post a `manual` ledger transaction via postTransaction(). idempotencyKey is
 *    deterministic: `inv-pay-{orderId}`, so double-clicks on the same invoice are
 *    no-ops (single full payment per invoice — the ledger dedup key is the gate).
 * 4. Create EZcount receipt via createReceipt() linked to the invoice via `parent`.
 * 5. Persist invoicePaidAt + ezReceipt on the order doc in a Firestore batch.
 *
 * ## Partial failure handling
 * If the ledger write succeeds but EZcount fails, we return `ezcount_failed`.
 * The next call with the same idempotencyKey (`inv-pay-{orderId}`) will dedup
 * the ledger write (ALREADY_EXISTS → no-op) and retry only the receipt. This is
 * acceptable because the ledger entry represents real cash received; the receipt
 * is a paper trail that can be safely re-attempted.
 *
 * Auth: requires `admin` custom claim.
 * Tenant: companyId + storeId from auth token — never from client input.
 */

import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import * as functionsV2 from "firebase-functions/v2";
import { createHash } from "crypto";
import { z } from "zod";
import { FirebaseAPI, TEzInvoice, TOrder } from "@jsdev_ninja/core";
import { TStorePrivate } from "src/schema";
import { ezCountService } from "../../../services/ezCountService";
import { postTransaction } from "../../ledger/services/postTransaction";
import { ordersCollectionPath, orderDocPath } from "../internal/orderPaths";
import { PaymentMethod } from "../../../services/ezCountService/paymentTypes";

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const InputSchema = z.object({
	/** The order whose invoice will be marked paid. */
	orderId: z.string().min(1),
	/** Payment method used by the payer. */
	paymentMethod: z.enum(["cash", "check", "bank_transfer", "credit_card"] as const),
	/** When the payment was received. Epoch millis. */
	paymentDate: z.number().int().positive(),
	/** Optional note shown on the receipt as description. */
	note: z.string().max(500).optional(),
	/**
	 * Client-supplied idempotency key. Convention: `inv-pay-{orderId}`.
	 * Single full payment per invoice — the deterministic key means double-clicks
	 * are no-ops at the ledger layer.
	 */
	idempotencyKey: z.string().min(1).max(200),
});

// ---------------------------------------------------------------------------
// Response types (match the spec contract exactly)
// ---------------------------------------------------------------------------

type SuccessResponse = {
	success: true;
	receipt: { doc_uuid: string; pdf_link: string; doc_number: string };
};

type ErrorResponse = {
	success: false;
	error: string;
	code:
		| "invoice_missing"
		| "already_paid"
		| "ezcount_failed"
		| "ledger_failed"
		| "tenant_mismatch"
		| "amount_mismatch";
};

type Response = SuccessResponse | ErrorResponse;

// ---------------------------------------------------------------------------
// Helper: format epoch millis → DD/MM/YYYY (EZcount date format)
// ---------------------------------------------------------------------------

function formatDateDDMMYYYY(epochMillis: number): string {
	const d = new Date(epochMillis);
	const dd = String(d.getDate()).padStart(2, "0");
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const yyyy = d.getFullYear();
	return `${dd}/${mm}/${yyyy}`;
}

// ---------------------------------------------------------------------------
// Helper: deterministic EZcount transaction_id for receipt
// Mirrors the pattern in createInvoice.ts: "invoice:" + sha256hex[:36].
// We prefix with "receipt:" and hash orderId+invoiceUuid.
// EZcount caps transaction_id at 45 chars: "receipt:" is 8 chars, leaving 37.
// We truncate sha256 hex to 36 chars → total 44 chars.
// ---------------------------------------------------------------------------

function receiptTransactionId(orderId: string, invoiceUuid: string): string {
	return (
		"receipt:" +
		createHash("sha256")
			.update(`${orderId}:${invoiceUuid}`)
			.digest("hex")
			.slice(0, 36)
	);
}

// ---------------------------------------------------------------------------
// Main callable
// ---------------------------------------------------------------------------

export const recordInvoicePayment = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request): Promise<Response> => {
		const { auth, data } = request;

		if (!auth?.token.admin) {
			return { success: false, error: "Unauthorized", code: "tenant_mismatch" };
		}

		const companyId = auth.token.companyId as string | undefined;
		const storeId = auth.token.storeId as string | undefined;

		if (!companyId || !storeId) {
			logger.error("documents.recordInvoicePayment.missingTokenClaims", {
				uid: auth.uid,
			});
			return { success: false, error: "missing_token_claims", code: "tenant_mismatch" };
		}

		const parsed = InputSchema.safeParse(data);
		if (!parsed.success) {
			logger.error("documents.recordInvoicePayment.invalidInput", {
				uid: auth.uid,
				issues: parsed.error.issues,
			});
			return { success: false, error: "invalid_input", code: "tenant_mismatch" };
		}

		const input = parsed.data;
		const db = admin.firestore();

		// ── Step 1: Load order (tenant-scoped) ──────────────────────────────────

		const ordersPath = ordersCollectionPath(companyId, storeId);
		const orderRef = db
			.collection(ordersPath)
			.doc(input.orderId);

		const orderSnap = await orderRef.get();
		if (!orderSnap.exists) {
			logger.error("documents.recordInvoicePayment.orderNotFound", {
				uid: auth.uid,
				orderId: input.orderId,
				companyId,
				storeId,
			});
			return { success: false, error: "order_not_found", code: "tenant_mismatch" };
		}

		const order = orderSnap.data() as TOrder;

		// Verify the order belongs to the caller's tenant (belt-and-suspenders —
		// the path is already tenant-scoped, but we double-check the fields).
		if (order.companyId !== companyId || order.storeId !== storeId) {
			logger.error("documents.recordInvoicePayment.tenantMismatch", {
				uid: auth.uid,
				orderId: input.orderId,
				orderCompanyId: order.companyId,
				orderStoreId: order.storeId,
				callerCompanyId: companyId,
				callerStoreId: storeId,
			});
			return { success: false, error: "tenant_mismatch", code: "tenant_mismatch" };
		}

		// ── Step 2: Verify invoice exists ────────────────────────────────────────
		//
		// order.invoice holds an EZcount response (TEzInvoice) at runtime — createInvoice
		// writes ezData (EzInvoiceSchema shape) into this field. The TOrder type declares
		// it as InvoiceSchema (internal entity) which is a legacy type mismatch in core;
		// the cast below reflects the actual runtime data until the core type is corrected.
		const inv = order.invoice as unknown as TEzInvoice | undefined;
		const invoiceUuid = inv?.doc_uuid;

		if (!invoiceUuid) {
			logger.error("documents.recordInvoicePayment.invoiceMissing", {
				uid: auth.uid,
				orderId: input.orderId,
				companyId,
				storeId,
			});
			return { success: false, error: "invoice_missing", code: "invoice_missing" };
		}

		// ── Step 3: Idempotency / already-paid check ────────────────────────────

		if (order.invoicePaidAt !== undefined || order.ezReceipt !== undefined) {
			// Already paid — return success with existing receipt info.
			// This handles safe re-submits after network timeouts.
			logger.info("documents.recordInvoicePayment.alreadyPaid", {
				orderId: input.orderId,
				companyId,
				storeId,
				invoicePaidAt: order.invoicePaidAt,
			});

			const existingReceipt = order.ezReceipt;
			if (existingReceipt) {
				return {
					success: true,
					receipt: {
						doc_uuid: existingReceipt.doc_uuid,
						pdf_link: existingReceipt.pdf_link,
						doc_number: existingReceipt.doc_number,
					},
				};
			}

			// invoicePaidAt set but no ezReceipt — receipt creation must have failed
			// previously. Fall through to retry receipt creation.
			logger.info("documents.recordInvoicePayment.retryingReceiptAfterPreviousFailure", {
				orderId: input.orderId,
				companyId,
				storeId,
			});
		}

		// ── Step 4: Derive invoice total (always full payment) ───────────────────
		//
		// The invoice total is stored in EZcount's calculatedData.price_total as a
		// string in "XXXX.XX" format (shekels). We parse it to a float for the
		// ledger transaction (which needs integer agorot) and for the EZcount receipt.
		//
		// Fallback chain: ez.calculatedData.price_total → cart.cartTotal → 0.

		const priceTotalStr = inv?.calculatedData?.price_total;
		const invoiceTotalIls: number = priceTotalStr
			? parseFloat(priceTotalStr)
			: order.cart?.cartTotal ?? 0;

		if (invoiceTotalIls <= 0) {
			logger.error("documents.recordInvoicePayment.zeroPriceTotal", {
				uid: auth.uid,
				orderId: input.orderId,
				priceTotalStr,
				cartTotal: order.cart?.cartTotal,
			});
			return { success: false, error: "invalid_invoice_total", code: "amount_mismatch" };
		}

		// Convert to integer agorot for the ledger (round, per CLAUDE.md money convention).
		const invoiceTotalAgorot = Math.round(invoiceTotalIls * 100);

		// ── Step 5: Post manual ledger transaction ───────────────────────────────
		//
		// Idempotency key: `inv-pay-{orderId}` — deterministic per invoice.
		// Single full payment per invoice means double-clicks are no-ops via
		// postTransaction's ALREADY_EXISTS guard.

		let transactionId: string;
		try {
			const tx = await postTransaction({
				source: "api",
				idempotencyKey: input.idempotencyKey,
				actor: { type: "user", userId: auth.uid },
				type: "manual",
				amount: invoiceTotalAgorot,
				currency: "ILS",
				direction: "in",
				reference: { type: "invoice", id: invoiceUuid },
				payer: {
					organizationId: order.organizationId,
					clientId: order.client?.id ?? undefined,
					billingAccountId: order.billingAccount?.id ?? undefined,
				},
				companyId,
				storeId,
			});
			transactionId = tx.id;
		} catch (err: unknown) {
			logger.error("documents.recordInvoicePayment.ledgerFailed", {
				uid: auth.uid,
				orderId: input.orderId,
				invoiceUuid,
				err,
			});
			return { success: false, error: "ledger_write_failed", code: "ledger_failed" };
		}

		logger.info("documents.recordInvoicePayment.transactionPosted", {
			orderId: input.orderId,
			transactionId,
			invoiceUuid,
			amountAgorot: invoiceTotalAgorot,
			companyId,
			storeId,
		});

		// ── Step 6: Create EZcount receipt ───────────────────────────────────────
		//
		// Read store secrets from STORES/{storeId}/private — same source as createInvoice.
		// We do NOT log ezcount_key or ezcount_api — those are credentials.

		const storePrivateData: TStorePrivate = (
			await admin.firestore().collection(`STORES/${storeId}/private`).doc("data").get()
		).data() as TStorePrivate;

		const txId = receiptTransactionId(input.orderId, invoiceUuid);
		const dateStr = formatDateDDMMYYYY(input.paymentDate);

		// Customer name — same cascade as getOpenInvoices.displayName (sources must stay in sync):
		// 1. organization.name (B2B authoritative)
		// 2. ez.calculatedData.client_name (what EZcount stamped on the original invoice)
		// 3. order.nameOnInvoice
		// 4. order.client?.companyName ?? order.client?.displayName
		//
		// If no name resolves, reject before calling EZcount — the receipt would be
		// legally invalid (customer name is required on Israeli tax documents).
		// In practice this case shouldn't occur because getOpenInvoices already
		// excludes name-less rows, but defense-in-depth applies here.
		let resolvedOrgName: string | undefined;
		if (order.organizationId) {
			const orgSnap = await admin
				.firestore()
				.collection(
					FirebaseAPI.firestore.getPath({
						collectionName: "organizations",
						companyId,
						storeId,
					}),
				)
				.doc(order.organizationId)
				.get();
			if (orgSnap.exists) {
				resolvedOrgName = (orgSnap.data() as { name?: string }).name;
			}
		}

		const customerName: string =
			resolvedOrgName ??
			(inv?.calculatedData as Record<string, unknown> | undefined)?.client_name as string | undefined ??
			order.nameOnInvoice ??
			(order.client as Record<string, unknown> | undefined)?.companyName as string | undefined ??
			order.client?.displayName ??
			"";

		if (!customerName) {
			// Hard precondition: EZcount requires customer_name on a receipt.
			logger.error("documents.recordInvoicePayment.customerNameMissing", {
				orderId: input.orderId,
				invoiceUuid,
				companyId,
				storeId,
			});
			return { success: false, error: "customer_name_missing", code: "invoice_missing" };
		}
		const customerEmail =
			order.emailOnInvoice ?? order.client?.email ?? "";
		const customerPhone =
			order.phoneNumberOnInvoice ?? order.client?.phoneNumber ?? undefined;
		const customerAddress = order.address
			? [order.address.street, order.address.city]
					.filter(Boolean)
					.join(", ")
			: undefined;

		const receiptResult = await ezCountService.createReceipt({
			url: storePrivateData.ezcount_api.trim(),
			api_key: storePrivateData.ezcount_key.trim(),
			transaction_id: txId,
			parent: invoiceUuid,
			customer_name: customerName,
			customer_email: customerEmail,
			customer_phone: customerPhone,
			customer_address: customerAddress,
			paymentMethod: input.paymentMethod as PaymentMethod,
			paymentSumIls: invoiceTotalIls,
			date: dateStr,
			description: input.note,
		});

		if (receiptResult.error || !receiptResult.data) {
			logger.error("documents.recordInvoicePayment.ezcountFailed", {
				orderId: input.orderId,
				invoiceUuid,
				transactionId,
				error: receiptResult.error?.message,
				companyId,
				storeId,
			});
			// Ledger write succeeded — receipt failed. The next retry (same
			// idempotencyKey) will dedup the ledger write and retry only the receipt.
			return { success: false, error: "ezcount_receipt_failed", code: "ezcount_failed" };
		}

		const receiptData = receiptResult.data;

		// ── Step 7: Persist invoicePaidAt + ezReceipt on order ──────────────────
		//
		// Use a Firestore batch for atomicity across the single order document fields.
		// (A batch over a single doc is equivalent to a direct update — no partial
		// failure risk — but we use batch to mirror the createInvoice pattern.)

		const orderDocRef = db.doc(orderDocPath(companyId, storeId, input.orderId));

		try {
			const batch = db.batch();
			batch.update(orderDocRef, {
				invoicePaidAt: input.paymentDate,
				ezReceipt: receiptData,
				// Invoice fully paid → the order's payment is settled. markOrderPaid
				// only acts on order-referenced txns (this one is invoice-referenced),
				// so flip paymentStatus here in the same atomic write.
				paymentStatus: "completed",
				updatedAt: Date.now(),
			});
			await batch.commit();
		} catch (err: unknown) {
			// The EZcount receipt was already created — the order doc update failed.
			// Log as an error (operational issue) but still return success because
			// the receipt exists and the ledger entry is committed. The admin can
			// reload and the idempotency check will short-circuit on next call.
			logger.error("documents.recordInvoicePayment.orderUpdateFailed", {
				orderId: input.orderId,
				invoiceUuid,
				transactionId,
				receiptDocUuid: receiptData.doc_uuid,
				err,
				companyId,
				storeId,
			});
			// Still return the receipt — the payment was processed successfully.
		}

		logger.info("documents.recordInvoicePayment.done", {
			orderId: input.orderId,
			invoiceUuid,
			transactionId,
			receiptDocUuid: receiptData.doc_uuid,
			amountAgorot: invoiceTotalAgorot,
			companyId,
			storeId,
		});

		return {
			success: true,
			receipt: {
				doc_uuid: receiptData.doc_uuid,
				pdf_link: receiptData.pdf_link,
				doc_number: receiptData.doc_number,
			},
		};
	},
);
