/**
 * productsStore — Firestore access layer for products in the superAdmin module.
 *
 * All queries are tenant-scoped via paths.ts (getPath). Cursor pagination
 * uses the last document id as an opaque cursor.
 */
import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import type { TProduct } from "@jsdev_ninja/core";
import type { ProductListRow, ListReq, GetReq, SearchProductsReq } from "../contracts";
import { productsCollectionPath, productDocPath } from "./paths";

const db = () => admin.firestore();

/** Project a full product doc to the lean list row shape. */
function toListRow(id: string, data: TProduct): ProductListRow {
	// Pick the first locale value as the display name for the list
	const name =
		Array.isArray(data.name) && data.name.length > 0
			? (data.name[0]?.value ?? id)
			: id;

	return {
		id,
		sku: data.sku ?? "",
		name,
		isPublished: data.isPublished ?? false,
		price: data.price ?? 0,
		stockQuantity: data.stock?.quantity ?? null,
	};
}

/**
 * List products for a tenant, paginated.
 * Returns rows + optional nextCursor (last doc id of this page).
 */
export async function listProducts(
	req: ListReq,
): Promise<{ rows: ProductListRow[]; nextCursor: string | undefined }> {
	const { companyId, storeId, limit, cursor } = req;
	const collPath = productsCollectionPath(companyId, storeId);

	let query = db()
		.collection(collPath)
		.orderBy("created_at", "desc")
		.limit(limit);

	if (cursor) {
		const cursorDoc = await db().doc(`${collPath}/${cursor}`).get();
		if (cursorDoc.exists) {
			query = query.startAfter(cursorDoc);
		} else {
			logger.warn("superAdmin.productsStore.listProducts: cursor doc not found", {
				companyId,
				storeId,
				cursor,
			});
		}
	}

	const snap = await query.get();
	const rows = snap.docs.map((doc) => toListRow(doc.id, doc.data() as TProduct));
	const nextCursor = snap.docs.length === limit ? snap.docs[snap.docs.length - 1].id : undefined;

	return { rows, nextCursor };
}

/**
 * Get a single product by id, tenant-scoped.
 * Returns the full TProduct doc or null if absent.
 */
export async function getProduct(req: GetReq): Promise<TProduct | null> {
	const { companyId, storeId, id } = req;
	const docRef = db().doc(productDocPath(companyId, storeId, id));
	const snap = await docRef.get();

	if (!snap.exists) {
		return null;
	}

	return { id: snap.id, ...snap.data() } as TProduct;
}

/**
 * Search products by sku (exact) or by name (prefix match on first element).
 *
 * Firestore has no case-insensitive substring search. byName uses a range
 * query ( sentinel) for prefix matching — acceptable for an ops tool.
 *
 * NOTE for B4:
 *   byName search requires a composite index on the products collection:
 *     name (ASC) — because name is an array field, Firestore may require
 *     an array-contains query or a flattened text field for real prefix search.
 *   Current implementation queries on sku (exact) or falls back to a
 *   full-collection scan with client-side filter for byName (max 200 docs),
 *   since the name field is a LocaleSchema array and not directly queryable
 *   with a range filter. B4 should add a denormalized searchName string field
 *   if prefix search on name is required at scale.
 */
export async function searchProducts(
	req: SearchProductsReq,
): Promise<{ rows: ProductListRow[]; nextCursor: string | undefined }> {
	const { companyId, storeId, bySku, byName } = req;
	const collPath = productsCollectionPath(companyId, storeId);

	if (bySku) {
		// Exact sku lookup
		const snap = await db()
			.collection(collPath)
			.where("sku", "==", bySku)
			.limit(10)
			.get();

		const rows = snap.docs.map((doc) => toListRow(doc.id, doc.data() as TProduct));
		return { rows, nextCursor: undefined };
	}

	// byName: prefix match — name is a Locale[] array; we scan up to 200 docs
	// and filter client-side on the first element's value.
	// B4 note: add a denormalized `nameSearch` string field for scalable prefix search.
	const lowerQuery = byName!.toLowerCase();
	const snap = await db()
		.collection(collPath)
		.limit(200)
		.get();

	const rows = snap.docs
		.filter((doc) => {
			const data = doc.data() as TProduct;
			const firstName =
				Array.isArray(data.name) && data.name.length > 0
					? (data.name[0]?.value ?? "")
					: "";
			return firstName.toLowerCase().startsWith(lowerQuery);
		})
		.map((doc) => toListRow(doc.id, doc.data() as TProduct));

	return { rows, nextCursor: undefined };
}
