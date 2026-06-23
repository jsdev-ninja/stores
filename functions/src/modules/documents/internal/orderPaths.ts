import { FirebaseAPI } from "@jsdev_ninja/core";

/**
 * Tenant-scoped path helpers for order documents.
 *
 * Used by the documents module for order reads/writes related to invoice
 * payment state (invoicePaidAt, ezReceipt). The documents module should NOT
 * import from the orders module — instead, it uses these local helpers that
 * build paths via FirebaseAPI.firestore.getPath per the project's multi-tenant
 * isolation rules.
 */

export function ordersCollectionPath(companyId: string, storeId: string): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "orders",
	});
}

export function orderDocPath(companyId: string, storeId: string, orderId: string): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "orders",
		id: orderId,
	});
}
