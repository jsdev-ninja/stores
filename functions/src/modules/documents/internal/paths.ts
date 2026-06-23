import { FirebaseAPI } from "@jsdev_ninja/core";

// ---------------------------------------------------------------------------
// AR entry ledger — one immutable doc per accrual/settlement event
// ---------------------------------------------------------------------------

export function organizationBalanceEntryPath(
	companyId: string,
	storeId: string,
	entryId: string,
): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "organizationBalance",
		id: entryId,
	});
}

export function organizationBalanceCollectionPath(
	companyId: string,
	storeId: string,
): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "organizationBalance",
	});
}

// ---------------------------------------------------------------------------
// AR rollup — one doc per organization, O(1) balance reads
// ---------------------------------------------------------------------------

export function organizationBalanceRollupPath(
	companyId: string,
	storeId: string,
	organizationId: string,
): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "organizationBalanceRollup",
		id: organizationId,
	});
}

export function organizationBalanceRollupCollectionPath(
	companyId: string,
	storeId: string,
): string {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "organizationBalanceRollup",
	});
}
