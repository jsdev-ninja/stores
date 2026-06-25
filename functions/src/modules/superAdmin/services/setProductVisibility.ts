/**
 * setProductVisibility (E2) — toggle Product.isPublished for a single product.
 *
 * Flow:
 *   1. Read the product doc tenant-scoped via productDocPath.
 *   2. Return not_found if absent.
 *   3. Write { isPublished } with merge:true, capturing oldValue.
 *   4. Append one audit record (action: setProductVisibility, field: isPublished).
 *      If the audit append fails after a successful field write, log
 *      audit_write_failed at ERROR and still return success — the field change
 *      is the user's intent; a missing audit row is a monitoring concern.
 *
 * The existing onProductUpdate Firestore trigger re-syncs the product to Algolia
 * automatically. This service must NOT call Algolia.
 */
import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import type { TProduct } from "@jsdev_ninja/core";
import type { SetProductVisibilityReq, WriteResult } from "../contracts";
import { appendAuditEntry } from "../internal/auditStore";
import { productDocPath } from "../internal/paths";

const db = () => admin.firestore();

export async function setProductVisibility(
	req: SetProductVisibilityReq,
	actorUid: string,
	actorEmail: string | null,
): Promise<{ result: WriteResult } | { error: "not_found" | "internal" }> {
	const { companyId, storeId, id, isPublished } = req;
	const docPath = productDocPath(companyId, storeId, id);
	const docRef = db().doc(docPath);

	// Step 1 — read current doc (tenant-scoped)
	let snap: FirebaseFirestore.DocumentSnapshot;
	try {
		snap = await docRef.get();
	} catch (err: unknown) {
		logger.error("superAdmin.setProductVisibility: read failed", {
			actorUid,
			companyId,
			storeId,
			productId: id,
			err: err instanceof Error ? err.message : String(err),
		});
		return { error: "internal" };
	}

	// Step 2 — 404 if absent
	if (!snap.exists) {
		return { error: "not_found" };
	}

	const existing = snap.data() as TProduct;
	const oldValue: boolean = existing.isPublished ?? false;

	// Step 3 — write only the target field
	try {
		await docRef.set({ isPublished }, { merge: true });
	} catch (err: unknown) {
		logger.error("superAdmin.setProductVisibility: write failed", {
			actorUid,
			companyId,
			storeId,
			productId: id,
			err: err instanceof Error ? err.message : String(err),
		});
		return { error: "internal" };
	}

	const writeResult: WriteResult = {
		docId: id,
		field: "isPublished",
		oldValue,
		newValue: isPublished,
	};

	// Step 4 — append audit (best-effort; field write already succeeded)
	const timestamp = Date.now();
	try {
		await appendAuditEntry({
			actorUid,
			actorEmail,
			action: "setProductVisibility",
			companyId,
			storeId,
			collection: "products",
			docId: id,
			field: "isPublished",
			oldValue,
			newValue: isPublished,
			timestamp,
		});
	} catch (err: unknown) {
		// Audit failure must NOT fail the user's intended write.
		logger.error("superAdmin.setProductVisibility: audit_write_failed", {
			actorUid,
			companyId,
			storeId,
			productId: id,
			field: "isPublished",
			oldValue,
			newValue: isPublished,
			timestamp,
			err: err instanceof Error ? err.message : String(err),
		});
	}

	return { result: writeResult };
}
