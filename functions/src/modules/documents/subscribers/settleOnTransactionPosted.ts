import { logger } from "firebase-functions/v2";
import { subscribe } from "../../../platform/eventBus";
import {
	LedgerEventTypes,
	TransactionPostedPayload,
} from "../../ledger/events";
import { getTransactionById } from "../../ledger/internal/transactionsStore";
import { settleDebt } from "../services/settleDebt";

/**
 * Transaction types that represent money ACTUALLY RECEIVED by the store.
 * `hyp_j5_auth` is an authorization HOLD — no money has moved yet. It must NOT
 * settle AR because the corresponding `hyp_capture` will settle it later.
 * Settling on both would cause DOUBLE settlement.
 *
 * Only types in this allow-list reduce the org's AR balance.
 */
const RECEIVED_MONEY_TYPES = new Set(["hyp_capture", "hyp_direct", "manual"]);

/**
 * Reference types that can carry a B2B AR settlement.
 *   - "order"   — classic HYP payment against an order
 *   - "invoice" — manual payment recorded via recordInvoicePayment()
 *
 * Any future reference type added to this set is intentional — the comment
 * documents WHY each type belongs here, preventing accidental additions.
 */
const SETTLED_REFERENCE_TYPES = new Set(["order", "invoice"]);

/**
 * Subscribes to ledger.transaction_posted and reduces B2B org AR when:
 *   - type is one of: hyp_capture, hyp_direct, manual (money actually received)
 *   - direction is "in" (money received by the store)
 *   - reference.type is "order" OR "invoice"
 *   - payer.organizationId is present (B2B payment)
 *
 * Design decisions (locked):
 * - hyp_j5_auth is EXPLICITLY SKIPPED — it is an authorization hold, not received
 *   money. The later hyp_capture will settle AR. Settling on the auth would cause
 *   double settlement and would settle before money is captured.
 * - Refund (direction:"out") does NOT touch AR — only direction:"in" settles.
 * - reference.type "order" — classic HYP payment flow.
 * - reference.type "invoice" — manual payment recorded via recordInvoicePayment().
 *   Both types represent real cash received and must reduce AR.
 *
 * Security:
 * - The event payload is used only as a ROUTING HINT (which transaction to read).
 * - All authoritative values (amount, direction, type, reference, payer) are read
 *   from the STORED transaction doc, which was HYP-verified at write time.
 * - A tampered or replayed event payload cannot cause incorrect AR reductions.
 *
 * Idempotency:
 * - Entry doc id = `settle_{transactionId}`. Replay of the same transaction is a
 *   no-op regardless of how many times the event is re-delivered.
 *
 * Ported from budget/subscribers/reduceDebtOnTransactionPosted.ts (now deleted).
 */
export const settleOnTransactionPosted = subscribe(
	{
		name: "documents-settle-on-transaction-posted",
		type: LedgerEventTypes.transactionPosted,
		payloadSchema: TransactionPostedPayload,
	},
	async (event, ctx) => {
		const { payload } = event;
		const { companyId, storeId, eventId } = ctx;

		logger.info("documents.settleOnTransactionPosted: received", {
			eventId,
			transactionId: payload.transactionId,
			companyId,
			storeId,
		});

		// Re-read the stored transaction doc — the payload is only a routing hint.
		// If the doc is missing, throw so the event bus retries (read-after-write lag).
		const storedTx = await getTransactionById(companyId, storeId, payload.transactionId);
		if (!storedTx) {
			throw new Error(
				`documents.settleOnTransactionPosted: transaction doc not found: ${payload.transactionId} — will retry`,
			);
		}

		// Guard: only received-money types. hyp_j5_auth is an authorization HOLD —
		// no money has transferred yet. Settling on it would double-settle when the
		// later hyp_capture arrives. Explicitly skip it (and any future unknown type).
		if (!RECEIVED_MONEY_TYPES.has(storedTx.type)) {
			logger.info("documents.settleOnTransactionPosted: type is not a received-money type, skipping", {
				eventId,
				transactionId: storedTx.id,
				type: storedTx.type,
				allowedTypes: [...RECEIVED_MONEY_TYPES],
			});
			return;
		}

		// Guard: only inflows (evaluated against the stored doc — never the payload).
		if (storedTx.direction !== "in") {
			logger.info("documents.settleOnTransactionPosted: direction not 'in', skipping (refund does not touch AR)", {
				eventId,
				transactionId: storedTx.id,
				direction: storedTx.direction,
			});
			return;
		}

		// Guard: only order- or invoice-referenced transactions (from stored doc).
		// "order" = classic HYP payment; "invoice" = manual payment via recordInvoicePayment().
		if (!SETTLED_REFERENCE_TYPES.has(storedTx.reference?.type ?? "")) {
			logger.info("documents.settleOnTransactionPosted: reference type not in allow-list, skipping", {
				eventId,
				transactionId: storedTx.id,
				referenceType: storedTx.reference?.type ?? null,
				allowedReferenceTypes: [...SETTLED_REFERENCE_TYPES],
			});
			return;
		}

		// Guard: only B2B payments — payer.organizationId must be in the stored doc.
		const organizationId = storedTx.payer?.organizationId;
		if (!organizationId) {
			logger.info("documents.settleOnTransactionPosted: no payer.organizationId in stored tx, skipping (B2C)", {
				eventId,
				transactionId: storedTx.id,
			});
			return;
		}

		const amount = storedTx.amount;
		const billingAccountId = storedTx.payer?.billingAccountId ?? null;

		// FIX 4: dedup key is the transactionId (stable across event re-deliveries),
		// not the eventId (which changes on replay). One transaction can settle at most
		// once regardless of how many times transaction_posted is re-emitted.
		const { applied } = await settleDebt({
			organizationId,
			amount,
			transactionId: storedTx.id,
			billingAccountId,
			causedByEventId: eventId,
			companyId,
			storeId,
		});

		logger.info("documents.settleOnTransactionPosted: done", {
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
