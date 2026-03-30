import * as functionsV2 from "firebase-functions/v2";
import { TPaymentMethod } from "@jsdev_ninja/core";
import { createAppApi } from "../appApi";

export const getBudgetAccount = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request) => {
		const { auth, data } = request;
		if (!auth?.token.admin) return { success: false as const, error: "Unauthorized" };

		const companyId = auth.token.companyId as string;
		const storeId = auth.token.storeId as string;
		const { organizationId } = data as { organizationId: string };

		const appApi = createAppApi({ companyId, storeId, isAdmin: true });
		const account = await appApi.budget.getBudgetAccount(organizationId);
		return { success: true as const, data: account };
	},
);

export const listBudgetAccounts = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request) => {
		const { auth } = request;
		if (!auth?.token.admin) return { success: false as const, error: "Unauthorized" };

		const companyId = auth.token.companyId as string;
		const storeId = auth.token.storeId as string;

		const appApi = createAppApi({ companyId, storeId, isAdmin: true });
		const accounts = await appApi.budget.listBudgetAccounts();
		return { success: true as const, data: accounts };
	},
);

export const getBudgetTransactions = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request) => {
		const { auth, data } = request;
		if (!auth?.token.admin) return { success: false as const, error: "Unauthorized" };

		const companyId = auth.token.companyId as string;
		const storeId = auth.token.storeId as string;
		const { organizationId, billingAccountId } = data as {
			organizationId: string;
			billingAccountId?: string;
		};

		const appApi = createAppApi({ companyId, storeId, isAdmin: true });
		const transactions = await appApi.budget.getBudgetTransactions(organizationId, { billingAccountId });
		return { success: true as const, data: transactions };
	},
);

export const markOrderPaid = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request) => {
		const { auth, data } = request;
		if (!auth?.token.admin) return { success: false as const, error: "Unauthorized" };

		const companyId = auth.token.companyId as string;
		const storeId = auth.token.storeId as string;
		const paidByUserId = auth.uid;

		const { order, organizationId, organizationName, debt, paymentMethod, paymentReference, paymentDate, note } =
			data as {
				order: any;
				organizationId: string;
				organizationName: string;
				debt: number;
				paymentMethod: TPaymentMethod;
				paymentReference: string | null;
				paymentDate: number;
				note: string | null;
			};

		const appApi = createAppApi({ companyId, storeId, isAdmin: true });
		await appApi.budget.markOrderPaid({
			order,
			organizationId,
			organizationName,
			debt,
			paymentMethod,
			paymentReference,
			paymentDate,
			note,
			paidByUserId,
		});
		return { success: true as const };
	},
);

export const addBudgetManualTransaction = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request) => {
		const { auth, data } = request;
		if (!auth?.token.admin) return { success: false as const, error: "Unauthorized" };

		const companyId = auth.token.companyId as string;
		const storeId = auth.token.storeId as string;
		const createdBy = auth.uid;

		const { organizationId, organizationName, type, debt, note } = data as {
			organizationId: string;
			organizationName: string;
			type: "credit_note" | "debit_note";
			debt: number;
			note: string;
		};

		const appApi = createAppApi({ companyId, storeId, isAdmin: true });
		await appApi.budget.addManualTransaction({
			organizationId,
			organizationName,
			type,
			debt,
			note,
			createdBy,
		});
		return { success: true as const };
	},
);
