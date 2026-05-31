import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { z } from "zod";
import type { TOrganizationBudget, TBudgetRecord } from "@jsdev_ninja/core";
import {
	organizationBudgetPath,
	budgetIdempotencyPath,
} from "../internal/paths";
import { getJerusalemDateParts } from "../internal/dateParts";
import { BudgetIdempotencyMarkerSchema } from "../types";

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const ApplyBudgetEventInputSchema = z.object({
	companyId: z.string().min(1),
	storeId: z.string().min(1),
	organizationId: z.string().min(1),
	organizationName: z.string(),
	customerId: z.string(),
	customerName: z.string(),
	billingAccountId: z.string().nullable(),
	type: z.enum(["debt_increase", "debt_reduction"]),
	/** Integer agorot, always positive */
	amount: z.number().int().positive(),
	/** orderId (debt_increase) or ledger transactionId (debt_reduction) */
	relatedId: z.string().min(1),
	source: z.enum(["order", "ledger", "manual"]),
	/** null for manual admin writes (no idempotency marker needed) */
	causedByEventId: z.string().nullable(),
});

export type ApplyBudgetEventInput = z.infer<typeof ApplyBudgetEventInputSchema>;

// ---------------------------------------------------------------------------
// applyBudgetEvent — the ONLY writer of budgetRecords + organizationBudgets
// ---------------------------------------------------------------------------

/**
 * Atomically applies one budget event:
 *   1. Claims budgetIdempotency/{causedByEventId} via .create() — no-op on ALREADY_EXISTS
 *   2. Reads + updates organizationBudgets/{organizationId} snapshot
 *   3. Creates an immutable budgetRecords/{recordId} entry
 *
 * Returns { applied: true } on success, { applied: false } when the event
 * was already processed (idempotent replay).
 */
export async function applyBudgetEvent(
	rawInput: ApplyBudgetEventInput,
): Promise<{ applied: boolean }> {
	const input = ApplyBudgetEventInputSchema.parse(rawInput);

	const db = admin.firestore();
	const now = Date.now();
	const { year, month, yearMonth } = getJerusalemDateParts(now);

	const recordRef = db.collection(
		`${input.companyId}/${input.storeId}/budgetRecords`,
	).doc(); // auto-id for the immutable record

	const snapshotRef = db.doc(
		organizationBudgetPath(input.companyId, input.storeId, input.organizationId),
	);

	const markerRef = input.causedByEventId
		? db.doc(budgetIdempotencyPath(input.companyId, input.storeId, input.causedByEventId))
		: null;

	// TTL: 90 days from now
	const TTL_MS = 90 * 24 * 60 * 60 * 1000;
	const marker: z.infer<typeof BudgetIdempotencyMarkerSchema> = {
		eventId: input.causedByEventId ?? recordRef.id,
		processedAt: now,
		expiresAt: now + TTL_MS,
	};

	const record: TBudgetRecord = {
		recordId: recordRef.id,
		organizationId: input.organizationId,
		customerId: input.customerId,
		customerName: input.customerName,
		billingAccountId: input.billingAccountId,
		type: input.type,
		amount: input.amount,
		currency: "ILS",
		relatedId: input.relatedId,
		source: input.source,
		causedByEventId: input.causedByEventId,
		createdAt: now,
		year,
		month,
		yearMonth,
		companyId: input.companyId,
		storeId: input.storeId,
	};

	let applied = false;

	try {
		await db.runTransaction(async (txn) => {
			// ── READS FIRST (Firestore Admin SDK requires all reads before any write) ──

			// Step 1: read idempotency marker to detect already-processed events
			if (markerRef) {
				const markerSnap = await txn.get(markerRef);
				if (markerSnap.exists) {
					// Already processed — return early with no writes
					applied = false;
					return;
				}
			}

			// Step 2: read the existing snapshot
			const snapshotSnap = await txn.get(snapshotRef);
			const existing = snapshotSnap.exists
				? (snapshotSnap.data() as TOrganizationBudget)
				: null;

			const currentDebt = existing?.totalCurrentDebt ?? 0;
			const currentDebits = existing?.totalDebits ?? 0;
			const currentCredits = existing?.totalCredits ?? 0;

			let newDebt: number;
			let newDebits: number;
			let newCredits: number;

			if (input.type === "debt_increase") {
				newDebt = currentDebt + input.amount;
				newDebits = currentDebits + input.amount;
				newCredits = currentCredits;
			} else {
				// Non-negative floor: clamp the reduction to the current debt.
				// Over-reduction (amount > currentDebt) means an upstream bug — log it.
				// We record the CLAMPED amount in the budgetRecord so that the sum of all
				// records still equals the current balance.
				const appliedAmount = Math.min(input.amount, currentDebt);
				if (appliedAmount < input.amount) {
					logger.error("budget.reduction.clamped", {
						requestedAmount: input.amount,
						appliedAmount,
						currentDebt,
						organizationId: input.organizationId,
						relatedId: input.relatedId,
						causedByEventId: input.causedByEventId,
						companyId: input.companyId,
						storeId: input.storeId,
					});
					// Mutate local binding so the record reflects the clamped amount.
					// input is the parsed (readonly) value, so we shadow it on the record below.
					record.amount = appliedAmount;
				}
				newDebt = currentDebt - appliedAmount;
				newDebits = currentDebits;
				newCredits = currentCredits + appliedAmount;
			}

			const snapshot: TOrganizationBudget = {
				organizationId: input.organizationId,
				organizationName: input.organizationName,
				totalCurrentDebt: newDebt,
				totalDebits: newDebits,
				totalCredits: newCredits,
				currency: "ILS",
				updatedAt: now,
				companyId: input.companyId,
				storeId: input.storeId,
			};

			// ── WRITES (after all reads) ──

			// Step 3: claim idempotency marker — txn.create() fails atomically on
			// concurrent duplicate (ALREADY_EXISTS), which is caught below.
			if (markerRef) {
				txn.create(markerRef, marker);
			}

			// Step 4: set snapshot + create immutable record
			txn.set(snapshotRef, snapshot);
			txn.create(recordRef, record);

			applied = true;
		});
	} catch (err: unknown) {
		// ALREADY_EXISTS from txn.create(markerRef) means a concurrent transaction
		// raced us to the marker write and won — treat as idempotent replay.
		if (isAlreadyExists(err)) {
			logger.info("budget.applyBudgetEvent.idempotentReplay", {
				causedByEventId: input.causedByEventId,
				organizationId: input.organizationId,
				type: input.type,
				companyId: input.companyId,
				storeId: input.storeId,
			});
			return { applied: false };
		}
		throw err;
	}

	logger.info("budget.applyBudgetEvent.applied", {
		recordId: record.recordId,
		organizationId: input.organizationId,
		type: input.type,
		amount: input.amount,
		source: input.source,
		causedByEventId: input.causedByEventId,
		companyId: input.companyId,
		storeId: input.storeId,
	});

	return { applied };
}

/** gRPC ALREADY_EXISTS: numeric 6 or string "already-exists" */
function isAlreadyExists(err: unknown): boolean {
	const e = err as { code?: number | string };
	return e.code === 6 || e.code === "already-exists";
}
