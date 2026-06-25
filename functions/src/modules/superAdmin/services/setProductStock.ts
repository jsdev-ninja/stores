/**
 * setProductStock (E3) — set Product.stock.quantity for a single product.
 *
 * Flow:
 *   1. Read the product doc tenant-scoped via productDocPath.
 *   2. Return not_found if absent.
 *   3. If the product has no stock object (stock is optional in ProductSchema),
 *      return stock_uninitialized — never guess the unit.
 *   4. Write { stock: { quantity, unit } } with merge:true, capturing
 *      oldValue (the previous quantity).
 *   5. Append one audit record (action: setProductStock, field: stock.quantity).
 *      If the audit append fails after a successful field write, log
 *      audit_write_failed at ERROR and still return success.
 *
 * The existing onProductUpdate Firestore trigger re-syncs to Algolia.
 * This service must NOT call Algolia.
 */
import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import type { TProduct } from "@jsdev_ninja/core";
import type { SetProductStockReq, WriteResult } from "../contracts";
import { appendAuditEntry } from "../internal/auditStore";
import { productDocPath } from "../internal/paths";

const db = () => admin.firestore();

export async function setProductStock(
	req: SetProductStockReq,
	actorUid: string,
	actorEmail: string | null,
): Promise<{ result: WriteResult } | { error: "not_found" | "stock_uninitialized" | "internal" }> {
	const { companyId, storeId, id, quantity } = req;
	const docPath = productDocPath(companyId, storeId, id);
	const docRef = db().doc(docPath);

	// Step 1 — read current doc (tenant-scoped)
	let snap: FirebaseFirestore.DocumentSnapshot;
	try {
		snap = await docRef.get();
	} catch (err: unknown) {
		logger.error("superAdmin.setProductStock: read failed", {
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

	// Step 3 — reject if no stock object (we must not guess the unit)
	if (!existing.stock) {
		logger.warn("superAdmin.setProductStock: stock_uninitialized", {
			actorUid,
			companyId,
			storeId,
			productId: id,
		});
		return { error: "stock_uninitialized" };
	}

	const unit = existing.stock.unit;
	const oldValue: number = existing.stock.quantity;

	// Step 4 — write only the stock sub-object (preserving unit)
	try {
		await docRef.set({ stock: { quantity, unit } }, { merge: true });
	} catch (err: unknown) {
		logger.error("superAdmin.setProductStock: write failed", {
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
		field: "stock.quantity",
		oldValue,
		newValue: quantity,
	};

	// Step 5 — append audit (best-effort; field write already succeeded)
	const timestamp = Date.now();
	try {
		await appendAuditEntry({
			actorUid,
			actorEmail,
			action: "setProductStock",
			companyId,
			storeId,
			collection: "products",
			docId: id,
			field: "stock.quantity",
			oldValue,
			newValue: quantity,
			timestamp,
		});
	} catch (err: unknown) {
		// Audit failure must NOT fail the user's intended write.
		logger.error("superAdmin.setProductStock: audit_write_failed", {
			actorUid,
			companyId,
			storeId,
			productId: id,
			field: "stock.quantity",
			oldValue,
			newValue: quantity,
			timestamp,
			err: err instanceof Error ? err.message : String(err),
		});
	}

	return { result: writeResult };
}
