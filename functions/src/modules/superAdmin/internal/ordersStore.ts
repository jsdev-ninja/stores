/**
 * ordersStore — Firestore access layer for orders in the superAdmin module.
 *
 * All queries are tenant-scoped via paths.ts (getPath). Cursor pagination
 * uses the last document id as an opaque cursor.
 */
import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import type { TOrder } from "@jsdev_ninja/core";
import type { OrderListRow, ListReq, GetReq, SearchOrdersReq } from "../contracts";
import { ordersCollectionPath, orderDocPath } from "./paths";

const db = () => admin.firestore();

/** Project a full order doc to the lean list row shape. */
function toListRow(id: string, data: TOrder): OrderListRow {
	const customerName =
		data.client?.displayName ??
		data.nameOnInvoice ??
		null;

	return {
		id,
		date: data.date,
		status: data.status,
		paymentStatus: data.paymentStatus,
		customerName,
		// cart.cartTotal is stored as legacy shekels — display only, no math
		total: data.cart?.cartTotal ?? 0,
	};
}

/**
 * List orders for a tenant, newest first, cursor-paginated.
 * Returns rows + optional nextCursor (last doc id of this page).
 */
export async function listOrders(
	req: ListReq,
): Promise<{ rows: OrderListRow[]; nextCursor: string | undefined }> {
	const { companyId, storeId, limit, cursor } = req;
	const collPath = ordersCollectionPath(companyId, storeId);

	let query = db()
		.collection(collPath)
		.orderBy("date", "desc")
		.limit(limit);

	if (cursor) {
		const cursorDoc = await db().doc(`${collPath}/${cursor}`).get();
		if (cursorDoc.exists) {
			query = query.startAfter(cursorDoc);
		} else {
			logger.warn("superAdmin.ordersStore.listOrders: cursor doc not found", {
				companyId,
				storeId,
				cursor,
			});
		}
	}

	const snap = await query.get();
	const rows = snap.docs.map((doc) => toListRow(doc.id, doc.data() as TOrder));
	const nextCursor = snap.docs.length === limit ? snap.docs[snap.docs.length - 1].id : undefined;

	return { rows, nextCursor };
}

/**
 * Get a single order by id, tenant-scoped.
 * Returns the full TOrder doc or null if absent.
 */
export async function getOrder(req: GetReq): Promise<TOrder | null> {
	const { companyId, storeId, id } = req;
	const docRef = db().doc(orderDocPath(companyId, storeId, id));
	const snap = await docRef.get();

	if (!snap.exists) {
		return null;
	}

	return { id: snap.id, ...snap.data() } as TOrder;
}

/**
 * Search orders by exact id or by status filter.
 * At most one filter active at a time (validated by the schema).
 *
 * NOTE for B4: byStatus requires a composite index on
 *   (status ASC, date DESC) within the tenant-scoped orders collection.
 */
export async function searchOrders(
	req: SearchOrdersReq,
): Promise<{ rows: OrderListRow[]; nextCursor: string | undefined }> {
	const { companyId, storeId, byId, byStatus } = req;
	const collPath = ordersCollectionPath(companyId, storeId);

	if (byId) {
		// Exact lookup by doc id
		const snap = await db().doc(`${collPath}/${byId}`).get();
		if (!snap.exists) {
			return { rows: [], nextCursor: undefined };
		}
		return {
			rows: [toListRow(snap.id, snap.data() as TOrder)],
			nextCursor: undefined,
		};
	}

	// byStatus filter — newest first
	// B4 index needed: orders collection, status ASC + date DESC
	const snap = await db()
		.collection(collPath)
		.where("status", "==", byStatus)
		.orderBy("date", "desc")
		.limit(100)
		.get();

	const rows = snap.docs.map((doc) => toListRow(doc.id, doc.data() as TOrder));

	return { rows, nextCursor: undefined };
}
