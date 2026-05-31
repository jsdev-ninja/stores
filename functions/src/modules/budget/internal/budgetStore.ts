import admin from "firebase-admin";
import type { TOrganizationBudget, TBudgetRecord } from "@jsdev_ninja/core";
import {
	organizationBudgetPath,
	organizationBudgetsCollectionPath,
	budgetRecordsCollectionPath,
} from "./paths";

const db = () => admin.firestore();

export async function getOrganizationBudget(
	companyId: string,
	storeId: string,
	organizationId: string,
): Promise<TOrganizationBudget | null> {
	const snap = await db()
		.doc(organizationBudgetPath(companyId, storeId, organizationId))
		.get();
	if (!snap.exists) return null;
	return snap.data() as TOrganizationBudget;
}

export async function listOrganizationBudgets(
	companyId: string,
	storeId: string,
): Promise<TOrganizationBudget[]> {
	const snap = await db()
		.collection(organizationBudgetsCollectionPath(companyId, storeId))
		.orderBy("totalCurrentDebt", "desc")
		.get();
	return snap.docs.map((d) => d.data() as TOrganizationBudget);
}

export async function listBudgetRecords(
	companyId: string,
	storeId: string,
	organizationId: string,
	filters?: { billingAccountId?: string },
): Promise<TBudgetRecord[]> {
	let query: admin.firestore.Query = db()
		.collection(budgetRecordsCollectionPath(companyId, storeId))
		.where("organizationId", "==", organizationId)
		.orderBy("createdAt", "desc");

	if (filters?.billingAccountId) {
		query = query.where("billingAccountId", "==", filters.billingAccountId);
	}

	const snap = await query.get();
	return snap.docs.map((d) => d.data() as TBudgetRecord);
}
