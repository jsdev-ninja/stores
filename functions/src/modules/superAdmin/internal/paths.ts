/**
 * Firestore path helpers for the superAdmin module.
 *
 * All tenant-scoped paths are built via FirebaseAPI.firestore.getPath() from
 * @jsdev_ninja/core — NEVER hand-built. This enforces the multi-tenant
 * isolation requirement: {companyId}/{storeId}/{collectionName}[/{id}].
 *
 * The ONE documented exception in this file is auditCollectionPath(), which
 * returns the root SUPER_ADMIN_AUDIT collection. This is a deliberate,
 * architecture-approved exception (see docs/super-admin/architecture.md §5):
 *   - The audit log is cross-tenant by nature (god-mode operator log).
 *   - The actor is not a tenant member; the log belongs to the operator,
 *     not to any single tenant's data island.
 *   - Keeping it in a root collection isolates it from tenant write surface.
 *
 * All other paths in this module must go through getPath().
 */
import { FirebaseAPI } from "@jsdev_ninja/core";

// ─── Tenant-scoped collection paths ──────────────────────────────────────────

export function ordersCollectionPath(companyId: string, storeId: string): string {
	return FirebaseAPI.firestore.getPath({ companyId, storeId, collectionName: "orders" });
}

export function orderDocPath(companyId: string, storeId: string, orderId: string): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "orders",
		id: orderId,
	});
}

export function productsCollectionPath(companyId: string, storeId: string): string {
	return FirebaseAPI.firestore.getPath({ companyId, storeId, collectionName: "products" });
}

export function productDocPath(companyId: string, storeId: string, productId: string): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "products",
		id: productId,
	});
}

export function profilesCollectionPath(companyId: string, storeId: string): string {
	return FirebaseAPI.firestore.getPath({ companyId, storeId, collectionName: "profiles" });
}

export function profileDocPath(companyId: string, storeId: string, profileId: string): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "profiles",
		id: profileId,
	});
}

// ─── Root audit collection (documented exception) ────────────────────────────

/**
 * Returns the root SUPER_ADMIN_AUDIT collection path.
 *
 * This is the ONLY root collection (besides STORES) in this module.
 * It is a deliberate exception documented in architecture §5. The audit log
 * must NOT be pathed under a tenant — it records cross-tenant god-mode
 * actions by the operator.
 *
 * Firestore security rules DENY all client access to SUPER_ADMIN_AUDIT.
 * Reads go through the verified saListAuditEntries callable (Admin SDK).
 */
export function auditCollectionPath(): string {
	return "SUPER_ADMIN_AUDIT";
}
