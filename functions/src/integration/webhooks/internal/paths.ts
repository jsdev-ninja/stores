export function webhookSubscriptionsCollectionPath(
	companyId: string,
	storeId: string,
): string {
	return `${companyId}/${storeId}/webhookSubscriptions`;
}

export function webhookSubscriptionPath(
	companyId: string,
	storeId: string,
	subscriptionId: string,
): string {
	return `${webhookSubscriptionsCollectionPath(companyId, storeId)}/${subscriptionId}`;
}
