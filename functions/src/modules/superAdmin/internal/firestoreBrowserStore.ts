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
	let query: FirebaseFirestore.Query = db()
		.collection(collectionPath)
		.orderBy(admin.firestore.FieldPath.documentId())
		.limit(limit);

	if (cursor) {
		// startAfter a document reference by its full path
		const cursorRef = db().doc(`${collectionPath}/${cursor}`);
		query = query.startAfter(cursorRef);
	}

	const snap = await query.get();

	const docs = snap.docs.map((d) => ({ id: d.id }));
	const nextCursor =
		snap.docs.length === limit ? snap.docs[snap.docs.length - 1].id : undefined;

	logger.info("superAdmin.firestoreBrowserStore.listDocuments: ok", {
		collectionPath,
		count: docs.length,
		hasMore: nextCursor !== undefined,
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
