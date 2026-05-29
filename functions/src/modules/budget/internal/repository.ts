import admin from "firebase-admin";
import { FirebaseAPI } from "@jsdev_ninja/core";
import type { TBudgetAccount, TBudgetTransaction } from "../types";
import type { TBudgetRollup } from "../types";
import {
	budgetAccountPath,
	budgetTransactionsCollectionPath,
	budgetRollupsCollectionPath,
	budgetRollupPath,
} from "./paths";

const db = () => admin.firestore();

export async function getAccount(
	companyId: string,
	storeId: string,
	organizationId: string,
): Promise<TBudgetAccount | null> {
	const snap = await db().doc(budgetAccountPath(companyId, storeId, organizationId)).get();
	if (!snap.exists) return null;
	return snap.data() as TBudgetAccount;
}

export async function listAccounts(companyId: string, storeId: string): Promise<TBudgetAccount[]> {
	const collectionPath = FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "budgetAccounts",
	});
	const snap = await db().collection(collectionPath).get();
	return snap.docs.map((d) => d.data() as TBudgetAccount);
}

export async function listTransactions(
	companyId: string,
	storeId: string,
	organizationId: string,
	filter?: { orderId?: string; billingAccountId?: string },
): Promise<TBudgetTransaction[]> {
	let query: admin.firestore.Query = db().collection(
		budgetTransactionsCollectionPath(companyId, storeId, organizationId),
	);
	if (filter?.orderId !== undefined) {
		query = query.where("orderId", "==", filter.orderId);
	}
	if (filter?.billingAccountId !== undefined) {
		query = query.where("billingAccountId", "==", filter.billingAccountId);
	}
	query = query.orderBy("createdAt", "asc");
	const snap = await query.get();
	return snap.docs.map((d) => d.data() as TBudgetTransaction);
}

export async function getRollup(
	companyId: string,
	storeId: string,
	rollupId: string,
): Promise<TBudgetRollup | null> {
	const snap = await db().doc(budgetRollupPath(companyId, storeId, rollupId)).get();
	if (!snap.exists) return null;
	return snap.data() as TBudgetRollup;
}

export async function listRollups(
	companyId: string,
	storeId: string,
	filter: {
		granularity: TBudgetRollup["granularity"];
		period?: string;
		periodFrom?: string;
		periodTo?: string;
		organizationId?: string | null;
		billingAccountId?: string | null;
	},
): Promise<TBudgetRollup[]> {
	let query: admin.firestore.Query = db()
		.collection(budgetRollupsCollectionPath(companyId, storeId))
		.where("granularity", "==", filter.granularity);

	if (filter.period !== undefined) {
		query = query.where("period", "==", filter.period);
	} else {
		if (filter.periodFrom !== undefined) {
			query = query.where("period", ">=", filter.periodFrom);
		}
		if (filter.periodTo !== undefined) {
			query = query.where("period", "<=", filter.periodTo);
		}
	}

	if ("organizationId" in filter) {
		query = query.where("organizationId", "==", filter.organizationId ?? null);
	}
	if ("billingAccountId" in filter) {
		query = query.where("billingAccountId", "==", filter.billingAccountId ?? null);
	}

	query = query.orderBy("period", "asc");
	const snap = await query.get();
	return snap.docs.map((d) => d.data() as TBudgetRollup);
}
