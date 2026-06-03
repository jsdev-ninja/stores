// Types (legacy + new)
export * from "./types";

// Internal paths (used by budget callables + other modules that read budget data)
export * from "./internal/paths";

// Callables
export {
	getBudgetAccount,
	listBudgetAccounts,
	getBudgetTransactions,
	markOrderPaid,
	addBudgetManualTransaction,
} from "./api/budgetApi";

// Subscribers (export for wiring in index.tsx — B5)
export { increaseDebtOnOrderPlaced } from "./subscribers/increaseDebtOnOrderPlaced";
export { reduceDebtOnOrderCancelled, reduceDebtOnOrderRefunded } from "./subscribers/reduceDebtOnOrderReversed";
export { reduceDebtOnTransactionPosted } from "./subscribers/reduceDebtOnTransactionPosted";

// Budget redesign — ledger-derived projections (Phase 1, dual-write)
export { updateProjectionsOnTransactionPosted } from "./subscribers/updateProjectionsOnTransactionPosted";
export { reconcileBudgetProjections } from "./api/reconcileBudgetProjections";
export { reconcileProjectionsSchedule } from "./triggers/reconcileProjectionsSchedule";
export { reconcileProjections } from "./services/reconcileProjections";
export {
	OrgBalanceSchema,
	RevenueRollupSchema,
} from "./types";
export type { TOrgBalance, TRevenueRollup } from "./types";
