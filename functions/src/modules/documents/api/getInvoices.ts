import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import * as functionsV2 from "firebase-functions/v2";
import { z } from "zod";
import { FirebaseAPI, TOrder, TOrganization } from "@jsdev_ninja/core";
import { ordersCollectionPath } from "../internal/orderPaths";

/**
 * Derived payment status for an invoice row.
 *
 * The data model has NO partial payments — `recordInvoicePayment` is
 * full-payment-only — so in practice an invoice is either "paid" or "open".
 * The "partial" literal is reserved for the future partial-payments work so
 * that producer + consumers don't need a breaking change when it lands (see
 * docs/plans/invoices-list-and-bulk-billing.md "Fan-out note").
 */
export type InvoiceStatus = "paid" | "partial" | "open";

/**
 * Shape returned for each invoice row by `getInvoices`.
 *
 * Unlike `getOpenInvoices` (unpaid only), this returns ALL invoices — paid AND
 * open — and derives `paid` / `balance` / `status` server-side.
 *
 * Monetary amounts (`total`, `paid`, `balance`) are in shekels (ILS float) —
 * mirrors the legacy data convention where cart.cartTotal is stored in shekels.
 *
 * `displayName` is REQUIRED — an invoice without a customer name is legally
 * invalid in Israel. If no name can be resolved the row is excluded from
 * results and a WARN is logged (same hard rule as getOpenInvoices).
 */
export type InvoiceRow = {
	orderId: string;
	invoiceUuid: string;
	invoiceNumber: string;
	invoicePdfLink: string;
	issueDate: number; // epoch millis
	total: number; // shekels (ILS)
	paid: number; // shekels — 0 or total (no partial payments)
	balance: number; // shekels — total - paid
	status: InvoiceStatus; // derived
	displayName: string; // REQUIRED — name that appears on the invoice
	organizationId?: string; // kept for company-filter dropdown, not for display
	allocationNumber?: string; // o.invoice.allocationNumber (ITA חשבונית ישראל)
	paidAt?: number; // o.invoicePaidAt (epoch millis)
};

const InputSchema = z.object({
	/** Optional: filter by minimum order date (epoch millis inclusive). */
	fromDate: z.number().int().positive().optional(),
	/** Optional: filter by maximum order date (epoch millis inclusive). */
	toDate: z.number().int().positive().optional(),
});

/**
 * Admin: list ALL invoices (paid + open) for the caller's store.
 *
 * Auth: requires `admin` custom claim.
 * Tenant: companyId + storeId from auth token — never from client input.
 *
 * A row is included iff:
 *   1. o.ezInvoice.success == true AND o.ezInvoice.doc_uuid is present
 *   2. a customer name can be resolved (else excluded + WARN)
 *
 * Payment derivation (no partial payments):
 *   isPaid  = o.invoicePaidAt set OR o.ezReceipt present
 *   paid    = isPaid ? total : 0
 *   balance = total - paid
 *   status  = balance <= 0 ? "paid" : "open"
 *
 * This is the exact inverse of the "open" rule documented on Order.invoicePaidAt.
 *
 * Sorted newest invoice first (by o.date — closest proxy for invoice date).
 */
export const getInvoices = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request) => {
		const { auth, data } = request;

		if (!auth?.token.admin) {
			return { success: false as const, error: "Unauthorized" };
		}

		const companyId = auth.token.companyId as string | undefined;
		const storeId = auth.token.storeId as string | undefined;

		if (!companyId || !storeId) {
			logger.error("documents.getInvoices.missingTokenClaims", {
				uid: auth.uid,
			});
			return { success: false as const, error: "missing_token_claims" };
		}

		const parsed = InputSchema.safeParse(data);
		if (!parsed.success) {
			logger.error("documents.getInvoices.invalidInput", {
				uid: auth.uid,
				issues: parsed.error.issues,
			});
			return { success: false as const, error: "invalid_input" };
		}

		const { fromDate, toDate } = parsed.data;
		const db = admin.firestore();
		const collPath = ordersCollectionPath(companyId, storeId);

		// Orders with an EZcount invoice (the modern flow). Same Firestore shape as
		// getOpenInvoices but WITHOUT the unpaid filter — we want paid rows too.
		let ezQuery = db
			.collection(collPath)
			.where("companyId", "==", companyId)
			.where("storeId", "==", storeId)
			.where("ezInvoice.success", "==", true)
			.orderBy("date", "desc");

		if (fromDate !== undefined) {
			ezQuery = ezQuery.where("date", ">=", fromDate);
		}
		if (toDate !== undefined) {
			ezQuery = ezQuery.where("date", "<=", toDate);
		}

		const ezSnap = await ezQuery.get();
		const orders = ezSnap.docs.map((d) => d.data() as TOrder);

		// ── Batch-read organizations to resolve display names ────────────────────
		// Collect unique organizationIds so we can satisfy source #1 of the name
		// cascade (org.name) without N+1 reads. getAll() caps at 500 docs per call.
		const uniqueOrgIds = [
			...new Set(
				orders
					.map((o) => o.organizationId)
					.filter((id): id is string => typeof id === "string" && id.length > 0),
			),
		];

		const orgNameMap = new Map<string, string>();

		if (uniqueOrgIds.length > 0) {
			const orgCollPath = FirebaseAPI.firestore.getPath({
				collectionName: "organizations",
				companyId,
				storeId,
			});

			const CHUNK_SIZE = 500; // Firestore getAll cap
			for (let i = 0; i < uniqueOrgIds.length; i += CHUNK_SIZE) {
				const chunk = uniqueOrgIds.slice(i, i + CHUNK_SIZE);
				const refs = chunk.map((id) => db.collection(orgCollPath).doc(id));
				const snaps = await db.getAll(...refs);
				for (const snap of snaps) {
					if (snap.exists) {
						const org = snap.data() as TOrganization;
						if (org.name) {
							orgNameMap.set(snap.id, org.name);
						}
					}
				}
			}
		}

		const rows: InvoiceRow[] = [];

		for (const order of orders) {
			const ez = order.ezInvoice;
			if (!ez?.doc_uuid) continue; // defensive

			const total =
				parseFloat(ez.calculatedData?.price_total ?? "0") ||
				(order.cart?.cartTotal ?? 0);

			// issueDate: EZcount returns the invoice date as calculatedData.date
			// (YYYY-MM-DD). Convert to epoch millis. Fallback to order.date.
			let issueDate = order.date;
			if (ez.calculatedData?.date) {
				const parsedDate = Date.parse(ez.calculatedData.date);
				if (!isNaN(parsedDate)) {
					issueDate = parsedDate;
				}
			}

			// Name resolution cascade (first hit wins) — identical to getOpenInvoices.
			const displayName: string | undefined =
				(order.organizationId ? orgNameMap.get(order.organizationId) : undefined) ??
				((ez.calculatedData as Record<string, unknown> | undefined)?.client_name as
					| string
					| undefined) ??
				order.nameOnInvoice ??
				((order.client as Record<string, unknown> | undefined)?.companyName as
					| string
					| undefined) ??
				order.client?.displayName;

			if (!displayName) {
				logger.warn("documents.getInvoices: excluding row — no resolvable customer name", {
					orderId: order.id,
					invoiceUuid: ez.doc_uuid,
					organizationId: order.organizationId ?? null,
					clientDisplayName: order.client?.displayName ?? null,
					nameOnInvoice: order.nameOnInvoice ?? null,
					companyId,
					storeId,
				});
				continue;
			}

			// Payment derivation (no partial payments).
			const isPaid = order.invoicePaidAt !== undefined || order.ezReceipt !== undefined;
			const paid = isPaid ? total : 0;
			const balance = total - paid;
			const status: InvoiceStatus = balance <= 0.01 ? "paid" : "open";

			// allocationNumber is persisted on order.invoice by createInvoice but is
			// not part of the formal InvoiceSchema — read it defensively.
			const allocationNumber = (order.invoice as Record<string, unknown> | undefined)
				?.allocationNumber as string | undefined;

			rows.push({
				orderId: order.id,
				invoiceUuid: ez.doc_uuid,
				invoiceNumber: ez.doc_number,
				invoicePdfLink: ez.pdf_link,
				issueDate,
				total,
				paid,
				balance,
				status,
				displayName,
				organizationId: order.organizationId,
				...(allocationNumber ? { allocationNumber } : {}),
				...(order.invoicePaidAt ? { paidAt: order.invoicePaidAt } : {}),
			});
		}

		logger.info("documents.getInvoices.done", {
			companyId,
			storeId,
			rowCount: rows.length,
			uid: auth.uid,
		});

		return { success: true as const, data: rows };
	},
);
