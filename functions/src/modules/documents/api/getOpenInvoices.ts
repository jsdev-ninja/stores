import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import * as functionsV2 from "firebase-functions/v2";
import { z } from "zod";
import { FirebaseAPI, TEzInvoice, TOrder, TOrganization } from "@jsdev_ninja/core";
import { ordersCollectionPath } from "../internal/orderPaths";

/**
 * Shape returned for each open invoice row.
 *
 * "Open" means: the order has an invoice (o.invoice) AND
 * neither invoicePaidAt nor ezReceipt is set on the order doc.
 *
 * Monetary amounts: `total` is in shekels (ILS float) — mirrors the legacy
 * data convention where cart.cartTotal is stored in shekels. Frontend converts
 * to agorot as needed.
 *
 * `displayName` is REQUIRED — an invoice without a customer name is legally
 * invalid in Israel. If no name can be resolved the row is excluded from
 * results and a WARN is logged. The `organizationId` field is kept for the
 * company-filter dropdown on the page — it is not used for display.
 */
export type OpenInvoiceRow = {
	orderId: string;
	invoiceUuid: string;
	invoiceNumber: string;
	invoicePdfLink: string;
	issueDate: number; // epoch millis
	total: number; // shekels (ILS)
	displayName: string; // REQUIRED — name that appears on the invoice
	organizationId?: string; // kept for company-filter dropdown, not for display
};

const InputSchema = z.object({
	/** Optional: filter by minimum order date (epoch millis inclusive). */
	fromDate: z.number().int().positive().optional(),
	/** Optional: filter by maximum order date (epoch millis inclusive). */
	toDate: z.number().int().positive().optional(),
});

/**
 * Admin: list all orders with an unpaid invoice for the caller's store.
 *
 * Auth: requires `admin` custom claim.
 * Tenant: companyId + storeId from auth token — never from client input.
 *
 * A row is included iff:
 *   1. o.invoice.doc_uuid is present (invoice exists)
 *   2. o.invoicePaidAt is unset (no payment recorded)
 *   3. o.ezReceipt is unset (no receipt issued)
 *
 * Firestore limitation: we cannot filter on "invoice present AND invoicePaidAt
 * absent" in a single compound query without a denormalized field. We query by
 * invoice.success == true (the primary flow), then filter server-side for
 * unpaid. At realistic volumes (hundreds of invoices/year per store) this is
 * acceptable. A future optimization can add a denormalized `invoiceOpen: bool`
 * field if query volume grows.
 *
 * Returns sorted newest invoice first (by o.date — the order creation date,
 * which is the closest proxy for invoice date in the data model).
 */
export const getOpenInvoices = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request) => {
		const { auth, data } = request;

		if (!auth?.token.admin) {
			return { success: false as const, error: "Unauthorized" };
		}

		const companyId = auth.token.companyId as string | undefined;
		const storeId = auth.token.storeId as string | undefined;

		if (!companyId || !storeId) {
			logger.error("documents.getOpenInvoices.missingTokenClaims", {
				uid: auth.uid,
			});
			return { success: false as const, error: "missing_token_claims" };
		}

		const parsed = InputSchema.safeParse(data);
		if (!parsed.success) {
			logger.error("documents.getOpenInvoices.invalidInput", {
				uid: auth.uid,
				issues: parsed.error.issues,
			});
			return { success: false as const, error: "invalid_input" };
		}

		const { fromDate, toDate } = parsed.data;
		const db = admin.firestore();
		const collPath = ordersCollectionPath(companyId, storeId);

		// Primary query: orders with an EZcount invoice (the modern flow).
		// invoice.success == true guarantees the EZcount call actually succeeded
		// and doc_uuid is present. We then filter unpaid in-process below.
		let ezQuery = db
			.collection(collPath)
			.where("companyId", "==", companyId)
			.where("storeId", "==", storeId)
			.where("invoice.success", "==", true)
			.orderBy("date", "desc");

		if (fromDate !== undefined) {
			ezQuery = ezQuery.where("date", ">=", fromDate);
		}
		if (toDate !== undefined) {
			ezQuery = ezQuery.where("date", "<=", toDate);
		}

		const ezSnap = await ezQuery.get();
		const allOrders = ezSnap.docs.map((d) => d.data() as TOrder);

		// Filter to unpaid: invoicePaidAt unset AND ezReceipt unset.
		const unpaidOrders = allOrders.filter(
			(o) => o.invoicePaidAt === undefined && o.ezReceipt === undefined,
		);

		// ── Batch-read organizations to resolve display names ────────────────────
		//
		// Collect all unique organizationIds from the candidate orders so we can
		// satisfy source #1 of the name cascade (org.name) without N+1 reads.
		// Firestore getAll() caps at 500 docs per call — chunk if needed.

		const uniqueOrgIds = [
			...new Set(
				unpaidOrders
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

		const rows: OpenInvoiceRow[] = [];

		for (const order of unpaidOrders) {
			// order.invoice holds an EZcount response (TEzInvoice) at runtime — createInvoice
			// writes ezData (EzInvoiceSchema shape) into this field. The TOrder type declares
			// it as InvoiceSchema (internal entity) which is a legacy type mismatch in core;
			// the cast below reflects the actual runtime data until the core type is corrected.
			const inv = order.invoice as unknown as TEzInvoice | undefined;
			if (!inv?.doc_uuid) continue; // defensive

			const total =
				parseFloat(inv.calculatedData?.price_total ?? "0") ||
				(order.cart?.cartTotal ?? 0);

			// issueDate: EZcount returns the invoice date as calculatedData.date (YYYY-MM-DD).
			// Convert to epoch millis. Fallback to order.date if absent.
			let issueDate = order.date;
			if (inv.calculatedData?.date) {
				const parsedDate = Date.parse(inv.calculatedData.date);
				if (!isNaN(parsedDate)) {
					issueDate = parsedDate;
				}
			}

			// Name resolution cascade (first hit wins):
			// 1. organization.name — authoritative for B2B orders
			// 2. inv.calculatedData.client_name — what EZcount stamped on the invoice
			// 3. order.nameOnInvoice — explicitly set on the order
			// 4. order.client?.companyName ?? order.client?.displayName — client fallback
			//
			// An invoice without a resolvable name is legally invalid in Israel.
			// Such rows are excluded from results and a WARN is logged.
			const displayName: string | undefined =
				(order.organizationId ? orgNameMap.get(order.organizationId) : undefined) ??
				(inv.calculatedData as Record<string, unknown> | undefined)?.client_name as string | undefined ??
				order.nameOnInvoice ??
				(order.client as Record<string, unknown> | undefined)?.companyName as string | undefined ??
				order.client?.displayName;

			if (!displayName) {
				logger.warn("documents.getOpenInvoices: excluding row — no resolvable customer name", {
					orderId: order.id,
					invoiceUuid: inv.doc_uuid,
					organizationId: order.organizationId ?? null,
					clientDisplayName: order.client?.displayName ?? null,
					nameOnInvoice: order.nameOnInvoice ?? null,
					companyId,
					storeId,
				});
				continue;
			}

			rows.push({
				orderId: order.id,
				invoiceUuid: inv.doc_uuid,
				invoiceNumber: inv.doc_number,
				invoicePdfLink: inv.pdf_link,
				issueDate,
				total,
				displayName,
				organizationId: order.organizationId,
			});
		}

		logger.info("documents.getOpenInvoices.done", {
			companyId,
			storeId,
			rowCount: rows.length,
			uid: auth.uid,
		});

		return { success: true as const, data: rows };
	},
);
