import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { FirebaseAPI, TOrder } from "@jsdev_ninja/core";
import { ordersCollectionPath } from "../internal/orderPaths";
import { accrueDebt } from "./accrueDebt";
import { settleDebt } from "./settleDebt";

// ---------------------------------------------------------------------------
// backfillOrganizationBalance — seed the AR entry ledger from historical data
// ---------------------------------------------------------------------------
//
// WHY THIS EXISTS
// The AR system (organizationBalance) only records entries going FORWARD:
//   - accrual  → on documents.delivery_note_created (accrueOnDeliveryNoteCreated)
//   - settlement → on ledger.transaction_posted (settleOnTransactionPosted)
// Orders/transactions created BEFORE those subscribers went live never produced
// AR entries, so their organizations show an empty ledger ("—" in the כרטסת card
// and ₪0 in the org-list "חוב פתוח" column). This one-time pass replays that
// history into the AR ledger.
//
// SAFETY
//   - Reuses the SAME idempotent services as the live subscribers, so the entry
//     doc ids are identical: accrual = `dn_{deliveryNoteId}`, settlement =
//     `settle_{transactionId}`. Re-running (or running after the subscribers have
//     already processed an item) is a no-op — never a double-accrual / double-settle.
//   - Applies the SAME guards as the subscribers so the backfill produces exactly
//     what the live path would have produced (no new business logic).
//   - `apply: false` (dry run) writes NOTHING — it only counts candidates so the
//     operator can preview the scope before committing.
//
// After applying, the rollup cache is already correct (writeArEntry updates it
// incrementally). Running reconcileOrganizationBalance afterwards is an optional
// parity check, not a requirement.

/** Transaction types that represent money ACTUALLY RECEIVED (mirror of settleOnTransactionPosted). */
const RECEIVED_MONEY_TYPES = new Set(["hyp_capture", "hyp_direct", "manual"]);
/** Reference types that can carry a B2B AR settlement (mirror of settleOnTransactionPosted). */
const SETTLED_REFERENCE_TYPES = new Set(["order", "invoice"]);

/** Minimal shape of a stored transaction doc — avoids importing ledger module internals. */
type StoredTransaction = {
	id: string;
	type?: string;
	amount?: number;
	direction?: string;
	reference?: { type?: string; id?: string };
	payer?: { organizationId?: string; billingAccountId?: string };
};

export type BackfillOrganizationBalanceReport = {
	companyId: string;
	storeId: string;
	apply: boolean;
	// Accruals (from historical delivery-note orders)
	ordersScanned: number;
	accrualCandidates: number;
	accrualsApplied: number; // newly-written entries (0 in dry run)
	// Settlements (from historical transactions)
	transactionsScanned: number;
	settlementCandidates: number;
	settlementsApplied: number; // newly-written entries (0 in dry run)
	/** organizationIds touched by at least one candidate entry. */
	organizationsTouched: number;
};

const db = () => admin.firestore();

/**
 * Replay historical delivery notes + payments into the AR entry ledger for one tenant.
 * When `apply` is false this is a dry run — counts candidates, writes nothing.
 */
export async function backfillOrganizationBalance(params: {
	companyId: string;
	storeId: string;
	apply?: boolean;
}): Promise<BackfillOrganizationBalanceReport> {
	const { companyId, storeId } = params;
	const apply = params.apply ?? false; // default to dry run — writing must be explicit
	const orgsTouched = new Set<string>();

	// ── 1. Accruals: every B2B order that carries a delivery note ──
	const ordersSnap = await db().collection(ordersCollectionPath(companyId, storeId)).get();
	let accrualCandidates = 0;
	let accrualsApplied = 0;

	for (const doc of ordersSnap.docs) {
		const order = doc.data() as TOrder;

		// Same guards as accrueOnDeliveryNoteCreated.
		if (!order.organizationId) continue;

		const deliveryNoteId = order.deliveryNote?.id ?? order.deliveryNote?.number ?? null;
		if (!deliveryNoteId) continue;

		// cart.cartTotal is stored in SHEKELS; AR is integer agorot. Convert at the
		// boundary, exactly as the subscriber does (see CLAUDE.md "Money").
		const cartTotalShekels = order.cart?.cartTotal;
		if (
			typeof cartTotalShekels !== "number" ||
			!Number.isFinite(cartTotalShekels) ||
			cartTotalShekels <= 0
		) {
			continue;
		}

		accrualCandidates++;
		orgsTouched.add(order.organizationId);

		if (apply) {
			const amount = Math.round(cartTotalShekels * 100);
			const { applied } = await accrueDebt({
				organizationId: order.organizationId,
				amount,
				deliveryNoteId,
				deliveryNoteNumber: order.deliveryNote?.number,
				orderId: order.id,
				billingAccountId: order.billingAccount?.id ?? null,
				causedByEventId: "backfill",
				companyId,
				storeId,
			});
			if (applied) accrualsApplied++;
		}
	}

	// ── 2. Settlements: every received-money B2B transaction ──
	const txSnap = await db()
		.collection(
			FirebaseAPI.firestore.getPath({ companyId, storeId, collectionName: "transactions" }),
		)
		.get();
	let settlementCandidates = 0;
	let settlementsApplied = 0;

	for (const doc of txSnap.docs) {
		const tx = doc.data() as StoredTransaction;

		// Same guards as settleOnTransactionPosted.
		if (!tx.type || !RECEIVED_MONEY_TYPES.has(tx.type)) continue;
		if (tx.direction !== "in") continue;
		if (!SETTLED_REFERENCE_TYPES.has(tx.reference?.type ?? "")) continue;
		const organizationId = tx.payer?.organizationId;
		if (!organizationId) continue;
		const amount = tx.amount;
		if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) continue;

		settlementCandidates++;
		orgsTouched.add(organizationId);

		if (apply) {
			const { applied } = await settleDebt({
				organizationId,
				amount,
				transactionId: tx.id,
				billingAccountId: tx.payer?.billingAccountId ?? null,
				causedByEventId: "backfill",
				companyId,
				storeId,
			});
			if (applied) settlementsApplied++;
		}
	}

	const report: BackfillOrganizationBalanceReport = {
		companyId,
		storeId,
		apply,
		ordersScanned: ordersSnap.size,
		accrualCandidates,
		accrualsApplied,
		transactionsScanned: txSnap.size,
		settlementCandidates,
		settlementsApplied,
		organizationsTouched: orgsTouched.size,
	};

	logger.info("documents.backfillOrganizationBalance.done", report);

	return report;
}
