import { FirebaseAPI } from "@jsdev_ninja/core";

export function transactionsPath(companyId: string, storeId: string): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "transactions",
	});
}

export function transactionDocPath(
	companyId: string,
	storeId: string,
	txId: string,
): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "transactions",
		id: txId,
	});
}

export function paymentLinksPath(companyId: string, storeId: string): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "paymentLinks",
	});
}

export function paymentLinkDocPath(
	companyId: string,
	storeId: string,
	token: string,
): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "paymentLinks",
		id: token,
	});
}

export function duplicateChargeAlertsPath(
	companyId: string,
	storeId: string,
): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "duplicateChargeAlerts",
	});
}

export function duplicateChargeAlertDocPath(
	companyId: string,
	storeId: string,
	alertId: string,
): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "duplicateChargeAlerts",
		id: alertId,
	});
}
