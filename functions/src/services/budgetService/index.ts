import admin from "firebase-admin";
import { FirebaseAPI, TBillingAccount, TBudgetAccount, TBudgetTransaction, TOrder, TPaymentMethod } from "@jsdev_ninja/core";
import { logger } from "firebase-functions/v2";

function budgetAccountPath(companyId: string, storeId: string, organizationId: string) {
	return FirebaseAPI.firestore.getPath({
		companyId,
		storeId,
		collectionName: "budgetAccounts",
		id: organizationId,
	});
}

function budgetTransactionsPath(companyId: string, storeId: string, organizationId: string) {
	return `${budgetAccountPath(companyId, storeId, organizationId)}/budgetTransactions`;
}

type AddTransactionParams = {
	companyId: string;
	storeId: string;
	organizationId: string;
	organizationName: string;
	transaction: Omit<TBudgetTransaction, "id" | "runningBalance">;
};

export const budgetService = {
	/**
	 * Add a transaction to an organization's budget account.
	 * Uses a Firestore transaction to atomically update balance + append ledger entry.
	 */
	async addTransaction(params: AddTransactionParams): Promise<void> {
		const { companyId, storeId, organizationId, organizationName, transaction } = params;
		const db = admin.firestore();

		const accountRef = db.doc(budgetAccountPath(companyId, storeId, organizationId));
		const txRef = db.collection(budgetTransactionsPath(companyId, storeId, organizationId)).doc();

		await db.runTransaction(async (t) => {
			const accountSnap = await t.get(accountRef);
			const now = Date.now();

			let currentBalance = 0;
			let totalDebits = 0;
			let totalCredits = 0;

			if (accountSnap.exists) {
				const existing = accountSnap.data() as TBudgetAccount;
				currentBalance = existing.balance;
				totalDebits = existing.totalDebits;
				totalCredits = existing.totalCredits;
			}

			const newBalance = currentBalance + transaction.debt;
			const newDebits = transaction.debt > 0 ? totalDebits + transaction.debt : totalDebits;
			const newCredits = transaction.debt < 0 ? totalCredits + Math.abs(transaction.debt) : totalCredits;

			const budgetTx: TBudgetTransaction = {
				...transaction,
				id: txRef.id,
				runningBalance: newBalance,
			};

			const account: TBudgetAccount = {
				id: organizationId,
				organizationId,
				organizationName,
				companyId,
				storeId,
				totalDebits: newDebits,
				totalCredits: newCredits,
				balance: newBalance,
				currency: "ILS",
				updatedAt: now,
			};

			t.set(accountRef, account);
			t.set(txRef, budgetTx);
		});

		logger.info("budgetService.addTransaction", {
			organizationId,
			type: transaction.type,
			debt: transaction.debt,
		});
	},

	/**
	 * Called when an order linked to an organization is created.
	 * Creates a debit transaction (positive amount = client owes more).
	 */
	async onOrderCreated(order: TOrder, companyId: string, storeId: string): Promise<void> {
		if (!order.organizationId) return;

		const organizationName = order.client?.displayName ?? order.client?.companyName ?? order.organizationId;
		const billingAccount = order.billingAccount as TBillingAccount | undefined;

		await budgetService.addTransaction({
			companyId,
			storeId,
			organizationId: order.organizationId,
			organizationName,
			transaction: {
				type: "order_created",
				debt: order.cart.cartTotal,
				orderId: order.id,
				orderTotal: order.cart.cartTotal,
				billingAccountId: billingAccount?.id ?? null,
				billingAccountName: billingAccount?.name ?? null,
				billingAccountNumber: billingAccount?.number ?? null,
				paymentReference: null,
				paymentDate: null,
				paymentMethod: null,
				note: null,
				createdAt: Date.now(),
				createdBy: "system",
			},
		});
	},

	/**
	 * Called when an order is cancelled or refunded.
	 * Creates a credit transaction that reverses the original debit.
	 */
	async onOrderCancelled(
		order: TOrder,
		companyId: string,
		storeId: string,
		type: "order_cancelled" | "order_refunded",
	): Promise<void> {
		if (!order.organizationId) return;

		const organizationName = order.client?.displayName ?? order.client?.companyName ?? order.organizationId;
		const billingAccount = order.billingAccount as TBillingAccount | undefined;

		await budgetService.addTransaction({
			companyId,
			storeId,
			organizationId: order.organizationId,
			organizationName,
			transaction: {
				type,
				debt: -order.cart.cartTotal, // negative = reverses debit
				orderId: order.id,
				orderTotal: order.cart.cartTotal,
				billingAccountId: billingAccount?.id ?? null,
				billingAccountName: billingAccount?.name ?? null,
				billingAccountNumber: billingAccount?.number ?? null,
				paymentReference: null,
				paymentDate: null,
				paymentMethod: null,
				note: null,
				createdAt: Date.now(),
				createdBy: "system",
			},
		});
	},

	/**
	 * Called when admin manually records a payment for an order.
	 * Creates a credit transaction (negative amount = reduces debt).
	 */
	async recordPayment(params: {
		companyId: string;
		storeId: string;
		organizationId: string;
		organizationName: string;
		order: TOrder;
		debt: number;
		paymentMethod: TPaymentMethod;
		paymentReference: string | null;
		paymentDate: number;
		note: string | null;
		createdBy: string;
	}): Promise<void> {
		const billingAccount = params.order.billingAccount as TBillingAccount | undefined;

		await budgetService.addTransaction({
			companyId: params.companyId,
			storeId: params.storeId,
			organizationId: params.organizationId,
			organizationName: params.organizationName,
			transaction: {
				type: "payment_received",
				debt: -params.debt, // negative = reduces debt
				orderId: params.order.id,
				orderTotal: params.order.cart.cartTotal,
				billingAccountId: billingAccount?.id ?? null,
				billingAccountName: billingAccount?.name ?? null,
				billingAccountNumber: billingAccount?.number ?? null,
				paymentReference: params.paymentReference,
				paymentDate: params.paymentDate,
				paymentMethod: params.paymentMethod,
				note: params.note,
				createdAt: Date.now(),
				createdBy: params.createdBy,
			},
		});
	},

	/**
	 * Add a manual credit or debit note (admin adjustment, not tied to an order).
	 */
	async addManualTransaction(params: {
		companyId: string;
		storeId: string;
		organizationId: string;
		organizationName: string;
		type: "credit_note" | "debit_note";
		debt: number; // always positive — direction determined by type
		note: string;
		createdBy: string;
	}): Promise<void> {
		const signedAmount = params.type === "credit_note" ? -Math.abs(params.debt) : Math.abs(params.debt);

		await budgetService.addTransaction({
			companyId: params.companyId,
			storeId: params.storeId,
			organizationId: params.organizationId,
			organizationName: params.organizationName,
			transaction: {
				type: params.type,
				debt: signedAmount,
				orderId: null,
				orderTotal: null,
				billingAccountId: null,
				billingAccountName: null,
				billingAccountNumber: null,
				paymentReference: null,
				paymentDate: null,
				paymentMethod: null,
				note: params.note,
				createdAt: Date.now(),
				createdBy: params.createdBy,
			},
		});
	},
};
