function root(companyId: string, storeId: string): string {
	return `${companyId}/${storeId}`;
}

export function budgetAccountShadowPath(
	companyId: string,
	storeId: string,
	organizationId: string,
): string {
	return `${root(companyId, storeId)}/budgetAccounts_shadow/${organizationId}`;
}

export function budgetTransactionsShadowCollectionPath(
	companyId: string,
	storeId: string,
	organizationId: string,
): string {
	return `${budgetAccountShadowPath(companyId, storeId, organizationId)}/budgetTransactions_shadow`;
}

export function budgetRollupsShadowCollectionPath(companyId: string, storeId: string): string {
	return `${root(companyId, storeId)}/budgetRollups_shadow`;
}

export function budgetRollupShadowPath(
	companyId: string,
	storeId: string,
	rollupId: string,
): string {
	return `${budgetRollupsShadowCollectionPath(companyId, storeId)}/${rollupId}`;
}

export function budgetIdempotencyShadowPath(
	companyId: string,
	storeId: string,
	eventId: string,
): string {
	return `${root(companyId, storeId)}/budgetIdempotency_shadow/${eventId}`;
}
