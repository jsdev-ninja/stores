import { FirebaseAPI } from "@jsdev_ninja/core";

// ---------------------------------------------------------------------------
// Revenue rollup paths — used by applyLedgerProjection + reconcileProjections
// ---------------------------------------------------------------------------

export function revenueRollupPath(
	companyId: string,
	storeId: string,
	yearMonth: string,
): string {
	return `${companyId}/${storeId}/revenueRollups/${yearMonth}`;
}

export function revenueRollupsCollectionPath(companyId: string, storeId: string): string {
	return `${companyId}/${storeId}/revenueRollups`;
}

// Marker doc per processed event for the projection writer (separate namespace).
export function projectionIdempotencyPath(
	companyId: string,
	storeId: string,
	eventId: string,
): string {
	return `${companyId}/${storeId}/projectionIdempotency/${eventId}`;
}

// ---------------------------------------------------------------------------
// Legacy callable paths — still referenced by the stubbed budget callables
// that keep the deployed function names stable until the admin UI is repointed
// (task 9). These collections are now inert (no new writes).
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
