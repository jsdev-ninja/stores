import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import {
	OrganizationBalanceEntrySchema,
	OrganizationBalanceRollupSchema,
	TOrganizationBalanceEntry,
	TOrganizationBalanceRollup,
} from "@jsdev_ninja/core";
import {
	organizationBalanceEntryPath,
	organizationBalanceRollupPath,
} from "./paths";

// ---------------------------------------------------------------------------
// organizationBalanceStore — the ONLY writer of AR entries + rollup docs
// ---------------------------------------------------------------------------
//
// All writes happen inside a single Firestore runTransaction:
//   1. txn.create(entryRef, entry)   → idempotency gate (ALREADY_EXISTS = replay)
//   2. txn.set(rollupRef, rollup)    → upsert the per-org running total
//
// If the entry already exists (ALREADY_EXISTS) the whole transaction is aborted
// and neither write is applied, so the rollup is never double-applied.

/** gRPC ALREADY_EXISTS: numeric 6 or string "already-exists" */
function isAlreadyExists(err: unknown): boolean {
	const e = err as { code?: number | string };
	return e.code === 6 || e.code === "already-exists";
}

export type WriteArEntryInput = {
	/** Deterministic doc id (dedup key). Derived from deliveryNoteId, eventId, etc. */
	entryId: string;
	organizationId: string;
	/** "+" accrual (owed increases), "-" settlement (owed decreases) */
	sign: "+" | "-";
	kind: "accrual" | "settlement" | "adjustment";
	/** Integer agorot, always positive; sign carries direction */
	amount: number;
	source: "delivery_note" | "ledger_payment" | "manual" | "order_reversal";
	document?: {
		type: "delivery_note" | "invoice";
		id: string;
		number?: string;
	};
	reference?: {
		type: "order" | "transaction" | "manual";
		id: string;
	};
	billingAccountId?: string | null;
	causedByEventId?: string;
	companyId: string;
	storeId: string;
};

export type WriteArEntryResult =
	| { written: true; entry: TOrganizationBalanceEntry; rollup: TOrganizationBalanceRollup }
	| { written: false; reason: "already_exists" };

/**
 * Atomically write an AR entry + update the per-org rollup.
 *
 * Returns `{ written: false, reason: "already_exists" }` when the entry doc
 * already exists (idempotent replay). The rollup is NEVER updated in that case.
 */
export async function writeArEntry(
	input: WriteArEntryInput,
): Promise<WriteArEntryResult> {
	const db = admin.firestore();
	const now = Date.now();

	const entry: TOrganizationBalanceEntry = OrganizationBalanceEntrySchema.parse({
		id: input.entryId,
		organizationId: input.organizationId,
		sign: input.sign,
		kind: input.kind,
		amount: input.amount,
		currency: "ILS",
		source: input.source,
		document: input.document,
		reference: input.reference,
		billingAccountId: input.billingAccountId ?? null,
		dedupKey: input.entryId,
		causedByEventId: input.causedByEventId,
		createdAt: now,
		companyId: input.companyId,
		storeId: input.storeId,
	});

	const entryRef = db.doc(
		organizationBalanceEntryPath(input.companyId, input.storeId, input.entryId),
	);
	const rollupRef = db.doc(
		organizationBalanceRollupPath(input.companyId, input.storeId, input.organizationId),
	);

	let result: WriteArEntryResult | null = null;

	try {
		await db.runTransaction(async (txn) => {
			// ── READS FIRST (all reads before any write in Admin SDK) ──
			const rollupSnap = await txn.get(rollupRef);
			const existing = rollupSnap.exists
				? (rollupSnap.data() as TOrganizationBalanceRollup)
				: null;

			const currentOwed = existing?.owed ?? 0;
			const currentAccrued = existing?.totalAccrued ?? 0;
			const currentSettled = existing?.totalSettled ?? 0;

			// ── COMPUTE rollup update ──
			// IMPORTANT: compute nextAccrued/nextSettled FIRST, then derive owed from
			// them using the same formula as reconcileOrganizationBalance.ts:
			//   owed = max(0, totalAccrued - totalSettled)
			//
			// The previous approach `owed = max(0, currentOwed ± amount)` is
			// order-dependent and diverges from the reconcile. Worked example:
			//   accrue 100 → settle 150 → accrue 200
			//   old incremental: owed = 200  (wrong — clamp at 0 lost the overpayment)
			//   reconcile:       owed = 150  (200+100 accrued - 150 settled = 150)
			// With the formula below, both paths produce the same result.
			let nextAccrued: number;
			let nextSettled: number;

			if (input.sign === "+") {
				nextAccrued = currentAccrued + input.amount;
				nextSettled = currentSettled;
			} else {
				nextAccrued = currentAccrued;
				nextSettled = currentSettled + input.amount;
			}

			// Derive owed and credit from accumulators — identical to reconcileOrganizationBalance.ts.
			// At most one of {owed, credit} is non-zero.
			const nextOwed = Math.max(0, nextAccrued - nextSettled);
			const nextCredit = Math.max(0, nextSettled - nextAccrued);

			const rollup: TOrganizationBalanceRollup = OrganizationBalanceRollupSchema.parse({
				organizationId: input.organizationId,
				owed: nextOwed,
				credit: nextCredit,
				totalAccrued: nextAccrued,
				totalSettled: nextSettled,
				currency: "ILS",
				updatedAt: now,
				companyId: input.companyId,
				storeId: input.storeId,
			});

			// ── WRITES ──
			// .create() is the idempotency gate — throws ALREADY_EXISTS on replay.
			txn.create(entryRef, entry);
			txn.set(rollupRef, rollup);

			result = { written: true, entry, rollup };
		});
	} catch (err: unknown) {
		if (isAlreadyExists(err)) {
			logger.info("documents.organizationBalanceStore.alreadyExists", {
				entryId: input.entryId,
				organizationId: input.organizationId,
				companyId: input.companyId,
				storeId: input.storeId,
			});
			return { written: false, reason: "already_exists" };
		}
		throw err;
	}

	if (!result) {
		// Should never happen — transaction always sets result or throws.
		throw new Error("documents.organizationBalanceStore: transaction completed without result");
	}

	return result;
}
