import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";
import { z } from "zod";
import {
	getOrganizationBudget,
	listOrganizationBudgets,
	listBudgetRecords,
} from "../internal/budgetStore";
import { applyBudgetEvent } from "../services/applyBudgetEvent";

// ---------------------------------------------------------------------------
// Response-shape mappers — preserve the exact shapes the admin UI consumes
// ---------------------------------------------------------------------------

function mapBudgetAccountResponse(
	snap: import("@jsdev_ninja/core").TOrganizationBudget,
): {
	id: string;
	organizationId: string;
	organizationName: string;
	companyId: string;
	storeId: string;
	totalDebits: number;
	totalCredits: number;
	balance: number;
	currency: "ILS";
	updatedAt: number;
} {
	return {
		id: snap.organizationId,
		organizationId: snap.organizationId,
		organizationName: snap.organizationName,
		companyId: snap.companyId,
		storeId: snap.storeId,
		totalDebits: snap.totalDebits,
		totalCredits: snap.totalCredits,
		balance: snap.totalCurrentDebt,
		currency: "ILS",
		updatedAt: snap.updatedAt,
	};
}

function mapBudgetTransactionResponse(record: import("@jsdev_ninja/core").TBudgetRecord): {
	id: string;
	type: string;
	amount: number;
	runningBalance: number;
	orderId: string | null;
	billingAccountId: string | null;
	note: null;
	createdAt: number;
	createdBy: string;
} {
	return {
		id: record.recordId,
		type: record.type,
		amount: record.amount,
		runningBalance: 0, // not tracked per-record in the new model
		orderId: record.source === "order" ? record.relatedId : null,
		billingAccountId: record.billingAccountId,
		note: null,
		createdAt: record.createdAt,
		createdBy: record.customerId,
	};
}

// ---------------------------------------------------------------------------
// Callables
// ---------------------------------------------------------------------------

export const getBudgetAccount = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request) => {
		const { auth, data } = request;
		if (!auth?.token.admin) return { success: false as const, error: "Unauthorized" };

		const companyId = auth.token.companyId as string;
		const storeId = auth.token.storeId as string;

		const inputSchema = z.object({ organizationId: z.string().min(1) });
		const parsed = inputSchema.safeParse(data);
		if (!parsed.success) return { success: false as const, error: "Invalid input" };

		const snap = await getOrganizationBudget(companyId, storeId, parsed.data.organizationId);
		const account = snap ? mapBudgetAccountResponse(snap) : null;

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

		const snaps = await listOrganizationBudgets(companyId, storeId);
		const accounts = snaps.map(mapBudgetAccountResponse);

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

		const inputSchema = z.object({
			organizationId: z.string().min(1),
			billingAccountId: z.string().optional(),
		});
		const parsed = inputSchema.safeParse(data);
		if (!parsed.success) return { success: false as const, error: "Invalid input" };

		const records = await listBudgetRecords(
			companyId,
			storeId,
			parsed.data.organizationId,
			{ billingAccountId: parsed.data.billingAccountId },
		);

		const transactions = records.map(mapBudgetTransactionResponse);

		return { success: true as const, data: transactions };
	},
);

/**
 * markOrderPaid — DISABLED.
 *
 * Real HYP payments now auto-reduce debt via the ledger → budget subscriber.
 * Keeping the callable active would allow admins to double-reduce debt.
 * The callable returns an error explaining that the automatic path handles this.
 *
 * DO NOT delete this export — it is referenced by index.ts and the deployed function
 * must exist to avoid a breaking deployment change. Remove it in a future cleanup
 * once the admin UI no longer surfaces the "Mark as Paid" button.
 */
export const markOrderPaid = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request) => {
		const { auth } = request;
		if (!auth?.token.admin) return { success: false as const, error: "Unauthorized" };

		logger.warn("budget.markOrderPaid: callable is disabled — payments are tracked automatically via the ledger", {
			uid: auth.uid,
			companyId: auth.token.companyId,
			storeId: auth.token.storeId,
		});

		return {
			success: false as const,
			error: "markOrderPaid is disabled: payments are automatically tracked via the ledger. Contact the developer if a manual adjustment is needed.",
		};
	},
);

export const addBudgetManualTransaction = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request) => {
		const { auth, data } = request;
		if (!auth?.token.admin) return { success: false as const, error: "Unauthorized" };

		const companyId = auth.token.companyId as string;
		const storeId = auth.token.storeId as string;
		const createdBy = auth.uid ?? "admin";

		const inputSchema = z.object({
			organizationId: z.string().min(1),
			organizationName: z.string().min(1),
			type: z.enum(["credit_note", "debit_note"]),
			debt: z.number().int().positive(),
			note: z.string(),
		});

		const parsed = inputSchema.safeParse(data);
		if (!parsed.success) {
			logger.warn("budget.addBudgetManualTransaction: invalid input", {
				uid: createdBy,
				issues: parsed.error.issues,
				companyId,
				storeId,
			});
			return { success: false as const, error: "Invalid input" };
		}

		// "credit_note" = payment/credit (debt_reduction); "debit_note" = extra charge (debt_increase)
		const budgetType =
			parsed.data.type === "credit_note" ? "debt_reduction" : "debt_increase";

		await applyBudgetEvent({
			companyId,
			storeId,
			organizationId: parsed.data.organizationId,
			organizationName: parsed.data.organizationName,
			customerId: createdBy,
			customerName: createdBy,
			billingAccountId: null,
			type: budgetType,
			amount: parsed.data.debt,
			relatedId: `manual-${Date.now()}-${createdBy}`,
			source: "manual",
			causedByEventId: null, // manual writes have no event idempotency
		});

		return { success: true as const };
	},
);
