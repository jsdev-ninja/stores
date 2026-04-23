import admin from "firebase-admin";
import { tenantDb } from "./index";

// ──────────────────────────────────────────────────────────────
// 1. Create a tenant-scoped db handle.
//    Every call below is automatically prefixed with {companyId}/{storeId}.
// ──────────────────────────────────────────────────────────────

async function exampleFetchOrder(
	input: { companyId: string; storeId: string; orderId: string },
) {
	const db = tenantDb({ companyId: input.companyId, storeId: input.storeId });

	const snap = await db.doc("orders", input.orderId).get();
	return snap.data();
}

// ──────────────────────────────────────────────────────────────
// 2. Query a collection — chain Firestore operations as usual.
// ──────────────────────────────────────────────────────────────

async function exampleListPaidOrders(
	input: { companyId: string; storeId: string },
) {
	const db = tenantDb(input);

	const snap = await db
		.collection("orders")
		.where("status", "==", "paid")
		.orderBy("createdAt", "desc")
		.limit(50)
		.get();

	return snap.docs.map((d) => d.data());
}

// ──────────────────────────────────────────────────────────────
// 3. Subcollection — e.g. budgetTransactions under a budgetAccount.
// ──────────────────────────────────────────────────────────────

async function exampleListBudgetTransactions(
	input: { companyId: string; storeId: string; organizationId: string },
) {
	const db = tenantDb(input);

	const snap = await db
		.subcollection("budgetAccounts", input.organizationId, "budgetTransactions")
		.orderBy("appliedAt", "desc")
		.get();

	return snap.docs.map((d) => d.data());
}

// ──────────────────────────────────────────────────────────────
// 4. Combined with a transaction — the tx is obtained from
//    admin.firestore() directly. Use tenantDb to get tenant-scoped
//    refs you pass into tx.get / tx.update / tx.set.
// ──────────────────────────────────────────────────────────────

async function exampleUpdateOrderInTx(
	input: { companyId: string; storeId: string; orderId: string },
) {
	const rootDb = admin.firestore();
	const db = tenantDb(input);
	const orderRef = db.doc("orders", input.orderId);

	await rootDb.runTransaction(async (tx) => {
		const snap = await tx.get(orderRef);
		if (!snap.exists) throw new Error("order not found");
		tx.update(orderRef, { lastViewedAt: Date.now() });
	});
}

// Prevent "unused" warnings — this file is reference-only.
export const _example = {
	exampleFetchOrder,
	exampleListPaidOrders,
	exampleListBudgetTransactions,
	exampleUpdateOrderInTx,
};
