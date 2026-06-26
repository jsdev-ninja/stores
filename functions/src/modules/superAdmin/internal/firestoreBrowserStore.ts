/**
 * firestoreBrowserStore — raw Firestore access for the god-mode tree browser.
 *
 * INTENTIONAL CROSS-TENANT EXCEPTION: this store takes raw Firestore paths, not
 * tenant-scoped paths built by getPath(). This is the only place in the superAdmin
 * module where unscoped Firestore access is permitted. It is exclusively gated by
 * the superAdmin claim (enforced in the API callables) plus the `private` segment
 * guardrail enforced by assertPathAllowed() before any function here is called.
 *
 * All three functions are read-only (get / listCollections / collection query).
 * No writes. No deletes.
 */
import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import type { ListDocumentsRes, GetDocumentRes } from "../contracts";

const db = () => admin.firestore();

/** Returns child collection ids under a doc path, or root collections if path is empty. */
export async function listCollections(path?: string): Promise<string[]> {
	let collections: FirebaseFirestore.CollectionReference[];

	if (!path) {
		collections = await db().listCollections();
	} else {
		collections = await db().doc(path).listCollections();
	}

	const ids = collections
		.map((c) => c.id)
		// Drop the `private` subcollection — it holds HYP/payment secrets.
		.filter((id) => id.toLowerCase() !== "private")
		.sort();

	logger.info("superAdmin.firestoreBrowserStore.listCollections: ok", {
		path: path ?? "(root)",
		count: ids.length,
	});

	return ids;
}

/**
 * Lists document ids in a collection, ordered by __name__, cursor-paginated.
 * cursor is the last doc id from the previous page (startAfter semantics).
 */
export async function listDocuments(
	collectionPath: string,
	limit: number,
	cursor: string | null | undefined,
): Promise<ListDocumentsRes> {
	// Use listDocuments() (NOT a .get() query) so "phantom" documents are
	// included — ids that hold subcollections but have no fields of their own,
	// e.g. the {companyId}/{storeId} ancestor docs in this multi-tenant layout.
	// A .get() query returns only docs that have field data, which makes ancestor
	// collections (a companyId collection of storeId docs) look wrongly empty.
	const refs = await db().collection(collectionPath).listDocuments();
	const ids = refs.map((r) => r.id).sort();

	// listDocuments() has no native cursor; paginate in memory by id order.
	const from = cursor ? ids.findIndex((id) => id > cursor) : 0;
	const start = from === -1 ? ids.length : from;
	const pageIds = ids.slice(start, start + limit);
	const docs = pageIds.map((id) => ({ id }));
	const hasMore = start + pageIds.length < ids.length;
	const nextCursor = hasMore && pageIds.length > 0 ? pageIds[pageIds.length - 1] : undefined;

	logger.info("superAdmin.firestoreBrowserStore.listDocuments: ok", {
		collectionPath,
		total: ids.length,
		count: docs.length,
		hasMore,
	});

	return { docs, nextCursor };
}

/** Gets a single document. Returns null data if the document does not exist. */
export async function getDocument(path: string): Promise<GetDocumentRes> {
	const snap = await db().doc(path).get();

	logger.info("superAdmin.firestoreBrowserStore.getDocument: ok", {
		path,
		exists: snap.exists,
	});

	return {
		id: snap.id,
		data: snap.exists ? (snap.data() as Record<string, unknown>) ?? null : null,
	};
}
