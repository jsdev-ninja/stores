import { FirebaseAPI } from "@jsdev_ninja/core";

// ---------------------------------------------------------------------------
// New target-model paths (B1)
// ---------------------------------------------------------------------------

export function budgetRecordPath(
	companyId: string,
	storeId: string,
	recordId: string,
): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "budgetRecords",
		id: recordId,
	});
}

export function budgetRecordsCollectionPath(
	companyId: string,
	storeId: string,
): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "budgetRecords",
	});
}

export function organizationBudgetPath(
	companyId: string,
	storeId: string,
	organizationId: string,
): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "organizationBudgets",
		id: organizationId,
	});
}

export function organizationBudgetsCollectionPath(
	companyId: string,
	storeId: string,
): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "organizationBudgets",
	});
}

// ---------------------------------------------------------------------------
// Legacy paths (kept — used by legacy callables and old data)
// ---------------------------------------------------------------------------

export function budgetAccountPath(
	companyId: string,
	storeId: string,
	organizationId: string,
): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "budgetAccounts",
		id: organizationId,
	});
}

/**
 * Path to the budgetTransactions subcollection under a budget account.
 * Shape: {companyId}/{storeId}/budgetAccounts/{organizationId}/budgetTransactions
 *
 * Note: budgetTransactions is a subcollection of budgetAccounts in Firestore,
 * even though it also appears in storeCollections for query/rules purposes.
 * This matches the existing budgetService convention.
 */
export function budgetTransactionsCollectionPath(
	companyId: string,
	storeId: string,
	organizationId: string,
): string {
	return `${budgetAccountPath(companyId, storeId, organizationId)}/budgetTransactions`;
}

export function budgetTransactionPath(
	companyId: string,
	storeId: string,
	organizationId: string,
	transactionId: string,
): string {
	return `${budgetTransactionsCollectionPath(companyId, storeId, organizationId)}/${transactionId}`;
}

// budgetRollups not yet registered in storeCollections — plain template string used.
export function budgetRollupsCollectionPath(companyId: string, storeId: string): string {
	return `${companyId}/${storeId}/budgetRollups`;
}

export function budgetRollupPath(companyId: string, storeId: string, rollupId: string): string {
	return `${budgetRollupsCollectionPath(companyId, storeId)}/${rollupId}`;
}

// Marker doc per processed event. ID = eventId. TTL via expiresAt field (~90d).
export function budgetIdempotencyPath(
	companyId: string,
	storeId: string,
	eventId: string,
): string {
	return `${companyId}/${storeId}/budgetIdempotency/${eventId}`;
}
