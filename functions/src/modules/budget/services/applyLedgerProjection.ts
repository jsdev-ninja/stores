import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { z } from "zod";
import {
	revenueRollupPath,
	projectionIdempotencyPath,
} from "../internal/paths";
import { getJerusalemDateParts } from "../internal/dateParts";
import {
	RevenueRollupSchema,
	BudgetIdempotencyMarkerSchema,
	TRevenueRollup,
} from "../types";

// ---------------------------------------------------------------------------
// Input — one posted cash ledger transaction projected into revenue read-models.
// All authoritative values come from the STORED transaction doc (the caller
// re-reads it), never the event payload.
// ---------------------------------------------------------------------------

const ApplyLedgerProjectionInputSchema = z.object({
	companyId: z.string().min(1),
	storeId: z.string().min(1),
	/** The event id that produced this transaction — the idempotency key. */
	eventId: z.string().min(1),
	transactionId: z.string().min(1),
	/** Cash types only — AR accruals are handled by the documents module. */
	type: z.enum(["manual", "hyp_direct", "hyp_j5_auth", "hyp_capture"]),
	/** Integer agorot, always positive */
	amount: z.number().int().positive(),
	direction: z.enum(["in", "out"]),
	/** null for B2C / no-organization transactions */
	organizationId: z.string().nullable(),
	/** epoch millis — buckets the revenue rollup by Jerusalem month */
	createdAt: z.number().int().positive(),
});

export type ApplyLedgerProjectionInput = z.infer<
	typeof ApplyLedgerProjectionInputSchema
>;

// ---------------------------------------------------------------------------
// applyLedgerProjection — the ONLY writer of revenueRollups
//
// AR (orgBalances) has been removed from this service. It now lives in
// documents/services/accrueDebt.ts + settleDebt.ts.
// ---------------------------------------------------------------------------

/**
 * Atomically projects one posted cash ledger transaction into:
 *   - revenueRollups/{ym}  (money in/out by month, byMethod, byOrg)
 *
 * Idempotent: claims projectionIdempotency/{eventId} via .create() inside the
 * transaction; a replayed event is a no-op.
 *
 * These docs are caches — a nightly reconciliation job can rebuild them from
 * the ledger, so a missed/duplicated event self-corrects.
 */
export async function applyLedgerProjection(
	rawInput: ApplyLedgerProjectionInput,
): Promise<{ applied: boolean }> {
	const input = ApplyLedgerProjectionInputSchema.parse(rawInput);
	const db = admin.firestore();
	const now = Date.now();
	const { yearMonth } = getJerusalemDateParts(input.createdAt);

	const markerRef = db.doc(
		projectionIdempotencyPath(input.companyId, input.storeId, input.eventId),
	);
	const revenueRef = db.doc(
		revenueRollupPath(input.companyId, input.storeId, yearMonth),
	);

	const TTL_MS = 90 * 24 * 60 * 60 * 1000;
	const marker = BudgetIdempotencyMarkerSchema.parse({
		eventId: input.eventId,
		processedAt: now,
		expiresAt: now + TTL_MS,
	});

	const isCreditIn = input.direction === "in";
	const isCreditOut = input.direction === "out";

	let applied = false;

	try {
		await db.runTransaction(async (txn) => {
			// ── READS FIRST ──
			const markerSnap = await txn.get(markerRef);
			if (markerSnap.exists) {
				applied = false;
				return;
			}

			const revenueSnap = await txn.get(revenueRef);

			// ── COMPUTE ──
			// Revenue rollup — only money flow (in/out cash). No AR/debit logic here.
			let nextRevenue: TRevenueRollup | null = null;
			if (isCreditIn || isCreditOut) {
				const existing = revenueSnap.exists
					? (revenueSnap.data() as TRevenueRollup)
					: null;
				const totalIn = existing?.totalIn ?? 0;
				const totalOut = existing?.totalOut ?? 0;
				const byMethod = { ...(existing?.byMethod ?? {}) };
				const byOrg = { ...(existing?.byOrg ?? {}) };

				let nextIn = totalIn;
				let nextOut = totalOut;

				if (isCreditIn) {
					nextIn = totalIn + input.amount;
					byMethod[input.type] = (byMethod[input.type] ?? 0) + input.amount;
					const orgKey = input.organizationId ?? "b2c";
					byOrg[orgKey] = (byOrg[orgKey] ?? 0) + input.amount;
				} else {
					// refund out
					nextOut = totalOut + input.amount;
				}

				nextRevenue = RevenueRollupSchema.parse({
					yearMonth,
					totalIn: nextIn,
					totalOut: nextOut,
					net: nextIn - nextOut,
					byMethod,
					byOrg,
					currency: "ILS",
					updatedAt: now,
					companyId: input.companyId,
					storeId: input.storeId,
				});
			}

			// ── WRITES ──
			txn.create(markerRef, marker); // throws ALREADY_EXISTS on concurrent dup
			if (nextRevenue) txn.set(revenueRef, nextRevenue);

			applied = true;
		});
	} catch (err: unknown) {
		if (isAlreadyExists(err)) {
			logger.info("budget.applyLedgerProjection.idempotentReplay", {
				eventId: input.eventId,
				transactionId: input.transactionId,
				companyId: input.companyId,
				storeId: input.storeId,
			});
			return { applied: false };
		}
		throw err;
	}

	logger.info("budget.applyLedgerProjection.applied", {
		eventId: input.eventId,
		transactionId: input.transactionId,
		type: input.type,
		amount: input.amount,
		organizationId: input.organizationId,
		yearMonth,
		applied,
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
