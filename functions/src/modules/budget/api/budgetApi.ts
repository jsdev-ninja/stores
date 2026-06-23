import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";

// ---------------------------------------------------------------------------
// STUB callables — deployed names are kept stable so the admin UI continues to
// work until the UI is repointed to the documents module AR endpoints (task 9).
// These callables previously read/wrote legacy organizationBudgets/budgetRecords
// which are now inert. They return empty/zero results with the same shape.
//
// DO NOT delete these exports — removing a deployed Cloud Function triggers a
// delete+create on deploy. They will be removed in the admin-UI repoint step.
// ---------------------------------------------------------------------------

export const getBudgetAccount = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request) => {
		const { auth } = request;
		if (!auth?.token.admin) return { success: false as const, error: "Unauthorized" };

		logger.info("budget.getBudgetAccount: STUBBED — AR moved to documents module (pending task-9 UI repoint)", {
			uid: auth.uid,
			companyId: auth.token.companyId,
			storeId: auth.token.storeId,
		});

		// Return null account (same shape as before — admin UI shows "no data").
		return { success: true as const, data: null };
	},
);

export const listBudgetAccounts = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request) => {
		const { auth } = request;
		if (!auth?.token.admin) return { success: false as const, error: "Unauthorized" };

		logger.info("budget.listBudgetAccounts: STUBBED — AR moved to documents module (pending task-9 UI repoint)", {
			uid: auth.uid,
			companyId: auth.token.companyId,
			storeId: auth.token.storeId,
		});

		// Return empty list (same shape as before).
		return { success: true as const, data: [] };
	},
);

export const getBudgetTransactions = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request) => {
		const { auth } = request;
		if (!auth?.token.admin) return { success: false as const, error: "Unauthorized" };

		logger.info("budget.getBudgetTransactions: STUBBED — AR moved to documents module (pending task-9 UI repoint)", {
			uid: auth.uid,
			companyId: auth.token.companyId,
			storeId: auth.token.storeId,
		});

		// Return empty list (same shape as before).
		return { success: true as const, data: [] };
	},
);

/**
 * markOrderPaid — DISABLED.
 *
 * Real HYP payments now auto-reduce AR via the ledger → documents subscriber.
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
		const { auth } = request;
		if (!auth?.token.admin) return { success: false as const, error: "Unauthorized" };

		logger.warn("budget.addBudgetManualTransaction: STUBBED — manual AR adjustments are now posted via the documents module (pending task-9 UI repoint)", {
			uid: auth.uid,
			companyId: auth.token.companyId,
			storeId: auth.token.storeId,
		});

		return {
			success: false as const,
			error: "addBudgetManualTransaction is stubbed: manual AR adjustments are now handled by the documents module. Contact the developer.",
		};
	},
);
