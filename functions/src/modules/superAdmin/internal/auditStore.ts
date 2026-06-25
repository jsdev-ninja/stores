/**
 * auditStore — Firestore access layer for the SUPER_ADMIN_AUDIT root collection.
 *
 * This is the one module allowed to write to a root collection (besides STORES).
 * See architecture §5 and paths.ts for the documented justification.
 *
 * Write contract:
 *   appendAuditEntry() uses a deterministic doc id and Firestore .create().
 *   On ALREADY_EXISTS (replay / retry) the write is treated as an idempotent
 *   no-op — the existing record is returned unchanged.
 *
 * Read contract:
 *   listAuditEntries() orders newest-first (timestamp desc), optional
 *   companyId/storeId filters, cursor-paginated by last doc id.
 */
import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import type { AuditEntry, ListAuditReq } from "../contracts";
import { auditCollectionPath } from "./paths";

const db = () => admin.firestore();

/**
 * Deterministic audit doc id: sa_{actorUid}_{entityType}_{docId}_{field}_{timestampMillis}
 *
 * Slashes in field paths (e.g. "stock.quantity") are acceptable in doc ids;
 * no escaping needed. The combination is unique per (actor, target, millis).
 */
function auditDocId(entry: Omit<AuditEntry, "id">): string {
	return `sa_${entry.actorUid}_${entry.collection}_${entry.docId}_${entry.field}_${entry.timestamp}`;
}

/**
 * Append a single audit entry using .create() with a deterministic id.
 *
 * Idempotency: on ALREADY_EXISTS (Firestore error code 6) the method returns
 * without throwing — a replayed call is silently accepted as a no-op. Any
 * other error is re-thrown so the caller can log audit_write_failed.
 */
export async function appendAuditEntry(entry: Omit<AuditEntry, "id">): Promise<void> {
	const docId = auditDocId(entry);
	const docRef = db()
		.collection(auditCollectionPath())
		.doc(docId);

	const entryWithId: AuditEntry = { ...entry, id: docId };

	try {
		await docRef.create(entryWithId);
	} catch (err: unknown) {
		// Firestore ALREADY_EXISTS = gRPC code 6 / HTTP 409.
		// Both the Admin SDK and the emulator surface this as err.code === 6
		// or as a FirestoreError with code "already-exists".
		const code = (err as { code?: number | string }).code;
		if (code === 6 || code === "already-exists") {
			// Idempotent no-op — the record already exists from a previous attempt.
			logger.info("superAdmin.auditStore.appendAuditEntry: already-exists (idempotent no-op)", {
				docId,
				actorUid: entry.actorUid,
				action: entry.action,
			});
			return;
		}
		throw err;
	}
}

/**
 * List audit entries newest-first, cursor-paginated.
 *
 * Filtering:
 *   - Both companyId and storeId present → filter on both (most common).
 *   - Only companyId present → filter on companyId only.
 *   - Neither present → return all entries (cross-store view).
 *
 * NOTE for B4:
 *   The filtered queries (companyId/storeId + timestamp DESC) require a
 *   composite index on SUPER_ADMIN_AUDIT:
 *     companyId ASC, storeId ASC, timestamp DESC
 *   and optionally:
 *     companyId ASC, timestamp DESC
 *   Add these to functions/firestore.indexes.json in B4.
 */
export async function listAuditEntries(
	req: ListAuditReq,
): Promise<{ rows: AuditEntry[]; nextCursor: string | undefined }> {
	const { companyId, storeId, limit, cursor } = req;
	const collPath = auditCollectionPath();

	// Build base query — always ordered newest-first
	let query: FirebaseFirestore.Query = db()
		.collection(collPath)
		.orderBy("timestamp", "desc");

	if (companyId) {
		query = query.where("companyId", "==", companyId);
	}
	if (storeId) {
		query = query.where("storeId", "==", storeId);
	}

	query = query.limit(limit);

	if (cursor) {
		const cursorDoc = await db().doc(`${collPath}/${cursor}`).get();
		if (cursorDoc.exists) {
			query = query.startAfter(cursorDoc);
		} else {
			logger.warn("superAdmin.auditStore.listAuditEntries: cursor doc not found", {
				cursor,
				companyId,
				storeId,
			});
		}
	}

	const snap = await query.get();
	const rows = snap.docs.map((doc) => doc.data() as AuditEntry);
	const nextCursor =
		snap.docs.length === limit ? snap.docs[snap.docs.length - 1].id : undefined;

	return { rows, nextCursor };
}
