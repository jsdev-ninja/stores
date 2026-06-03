import { logger } from "firebase-functions/v2";
import { subscribe } from "../../../platform/eventBus";
import {
	LedgerEventTypes,
	TransactionPostedPayload,
} from "../../ledger/events";
import { getTransactionById } from "../../ledger/internal/transactionsStore";
import { applyLedgerProjection } from "../services/applyLedgerProjection";

/**
 * Subscribes to ledger.transaction_posted and projects every posted transaction
 * (credit AND debit) into the new read-models: orgBalances (accounts-receivable)
 * and revenueRollups (money in/out by month).
 *
 * This runs ALONGSIDE the legacy budget subscribers (dual-write) — it writes
 * only the new orgBalances/revenueRollups collections, never the legacy
 * organizationBudgets/budgetRecords. Parity can be compared before cutover.
 *
 * Security: the payload is only a routing hint. All authoritative values are
 * read from the STORED transaction doc.
 */
export const updateProjectionsOnTransactionPosted = subscribe(
	{
		name: "budget-update-projections-on-transaction-posted",
		type: LedgerEventTypes.transactionPosted,
		payloadSchema: TransactionPostedPayload,
	},
	async (event, ctx) => {
		const { payload } = event;
		const { companyId, storeId, eventId } = ctx;

		logger.info("budget.updateProjectionsOnTransactionPosted: received", {
			eventId,
			transactionId: payload.transactionId,
			companyId,
			storeId,
		});

		const storedTx = await getTransactionById(
			companyId,
			storeId,
			payload.transactionId,
		);
		if (!storedTx) {
			throw new Error(
				`budget.updateProjectionsOnTransactionPosted: transaction doc not found: ${payload.transactionId} — will retry`,
			);
		}

		const { applied } = await applyLedgerProjection({
			companyId,
			storeId,
			eventId,
			transactionId: storedTx.id,
			kind: storedTx.kind,
			type: storedTx.type,
			amount: storedTx.amount,
			direction: storedTx.direction,
			organizationId: storedTx.payer?.organizationId ?? null,
			createdAt: storedTx.createdAt,
		});

		logger.info("budget.updateProjectionsOnTransactionPosted: done", {
			eventId,
			transactionId: storedTx.id,
			kind: storedTx.kind,
			applied,
			companyId,
			storeId,
		});
	},
);
