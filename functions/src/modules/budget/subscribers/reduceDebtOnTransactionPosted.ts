import { logger } from "firebase-functions/v2";
import { subscribe } from "../../../platform/eventBus";
import {
	LedgerEventTypes,
	TransactionPostedPayload,
} from "../../ledger/events";
import { getTransactionById } from "../../ledger/internal/transactionsStore";
import { applyBudgetEvent } from "../services/applyBudgetEvent";

/**
 * Subscribes to ledger.transaction_posted and reduces B2B org debt when:
 *   - direction is "in" (money received)
 *   - reference.type is "order"
 *   - payer.organizationId is present (B2B payment)
 *
 * Security: the event payload is used only as a routing hint (which transaction
 * to read). All authoritative values (amount, direction, reference, payer) are
 * taken from the STORED transaction doc — which has been HYP-verified at write
 * time — so a tampered or replayed event payload cannot cause incorrect debt
 * reductions.
 */
export const reduceDebtOnTransactionPosted = subscribe(
	{
		name: "budget-reduce-debt-on-transaction-posted",
		type: LedgerEventTypes.transactionPosted,
		payloadSchema: TransactionPostedPayload,
	},
	async (event, ctx) => {
		const { payload } = event;
		const { companyId, storeId, eventId } = ctx;

		logger.info("budget.reduceDebtOnTransactionPosted: received", {
			eventId,
			transactionId: payload.transactionId,
			companyId,
			storeId,
		});

		// Re-read the stored transaction doc — the payload is only used to locate it.
		// If the doc is missing, throw so the event bus retries (it may not be
		// committed yet due to read-after-write propagation lag).
		const storedTx = await getTransactionById(companyId, storeId, payload.transactionId);
		if (!storedTx) {
			throw new Error(
				`budget.reduceDebtOnTransactionPosted: transaction doc not found: ${payload.transactionId} — will retry`,
			);
		}

		// Guard: only inflows (evaluated against stored doc)
		if (storedTx.direction !== "in") {
			logger.info("budget.reduceDebtOnTransactionPosted: direction not 'in', skipping", {
				eventId,
				transactionId: storedTx.id,
				direction: storedTx.direction,
			});
			return;
		}

		// Guard: only order-referenced transactions (evaluated against stored doc)
		if (storedTx.reference?.type !== "order") {
			logger.info("budget.reduceDebtOnTransactionPosted: reference not 'order', skipping", {
				eventId,
				transactionId: storedTx.id,
				referenceType: storedTx.reference?.type ?? null,
			});
			return;
		}

		// Guard: only B2B payments — payer.organizationId must be present in stored doc
		const organizationId = storedTx.payer?.organizationId;
		if (!organizationId) {
			logger.info("budget.reduceDebtOnTransactionPosted: no payer.organizationId in stored tx, skipping (B2C)", {
				eventId,
				transactionId: storedTx.id,
			});
			return;
		}

		const amount = storedTx.amount;
		const billingAccountId = storedTx.payer?.billingAccountId ?? null;

		const { applied } = await applyBudgetEvent({
			companyId,
			storeId,
			organizationId,
			// organizationName is not in the ledger tx — use organizationId as fallback.
			// The snapshot's organizationName was set at debt_increase time and is preserved
			// across updates via txn.set (we always overwrite with the latest name).
			organizationName: organizationId,
			customerId: "system",
			customerName: "",
			billingAccountId,
			type: "debt_reduction",
			amount,
			// relatedId = ledger transactionId for debt reductions from ledger
			relatedId: storedTx.id,
			source: "ledger",
			causedByEventId: eventId,
		});

		logger.info("budget.reduceDebtOnTransactionPosted: done", {
			eventId,
			transactionId: storedTx.id,
			organizationId,
			amount,
			applied,
			companyId,
			storeId,
		});
	},
);
