import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { z } from "zod";
import {
	orgBalancePath,
	revenueRollupPath,
	projectionIdempotencyPath,
} from "../internal/paths";
import { getJerusalemDateParts } from "../internal/dateParts";
import {
	OrgBalanceSchema,
	RevenueRollupSchema,
	BudgetIdempotencyMarkerSchema,
	TOrgBalance,
	TRevenueRollup,
} from "../types";

// ---------------------------------------------------------------------------
// Input — one posted ledger transaction projected into the read-models.
// All authoritative values come from the STORED transaction doc (the caller
// re-reads it), never the event payload.
// ---------------------------------------------------------------------------

const ApplyLedgerProjectionInputSchema = z.object({
	companyId: z.string().min(1),
	storeId: z.string().min(1),
	/** The event id that produced this transaction — the idempotency key. */
	eventId: z.string().min(1),
	transactionId: z.string().min(1),
	kind: z.enum(["credit", "debit"]),
	type: z.enum([
		"manual",
		"hyp_direct",
		"hyp_j5_auth",
		"hyp_capture",
		"delivery_note",
		"invoice",
		"credit_note",
		"adjustment",
	]),
	/** Integer agorot, always positive */
	amount: z.number().int().positive(),
	direction: z.enum(["in", "out", "none"]),
	/** null for B2C / no-organization transactions */
	organizationId: z.string().nullable(),
	/** epoch millis — buckets the revenue rollup by Jerusalem month */
	createdAt: z.number().int().positive(),
});

export type ApplyLedgerProjectionInput = z.infer<
	typeof ApplyLedgerProjectionInputSchema
>;

// ---------------------------------------------------------------------------
// applyLedgerProjection — the ONLY writer of orgBalances + revenueRollups
// ---------------------------------------------------------------------------

/**
 * Atomically projects one posted ledger transaction into:
 *   - orgBalances/{orgId}     (accounts-receivable: owed = Σdebits − Σcredits-in, ≥0)
 *   - revenueRollups/{ym}     (money in/out by month, byMethod, byOrg)
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
	const orgRef = input.organizationId
		? db.doc(
				orgBalancePath(input.companyId, input.storeId, input.organizationId),
		  )
		: null;
	const revenueRef = db.doc(
		revenueRollupPath(input.companyId, input.storeId, yearMonth),
	);

	const TTL_MS = 90 * 24 * 60 * 60 * 1000;
	const marker = BudgetIdempotencyMarkerSchema.parse({
		eventId: input.eventId,
		processedAt: now,
		expiresAt: now + TTL_MS,
	});

	const isCreditIn = input.kind === "credit" && input.direction === "in";
	const isCreditOut = input.kind === "credit" && input.direction === "out";
	const isDebit = input.kind === "debit";

	let applied = false;

	try {
		await db.runTransaction(async (txn) => {
			// ── READS FIRST ──
			const markerSnap = await txn.get(markerRef);
			if (markerSnap.exists) {
				applied = false;
				return;
			}

			const orgSnap = orgRef ? await txn.get(orgRef) : null;
			const revenueSnap = await txn.get(revenueRef);

			// ── COMPUTE ──
			// Org balance (accounts receivable) — only for org-scoped transactions.
			let nextOrg: TOrgBalance | null = null;
			if (orgRef && input.organizationId) {
				const existing = orgSnap?.exists
					? (orgSnap.data() as TOrgBalance)
					: null;
				const owed = existing?.owed ?? 0;
				const totalDebits = existing?.totalDebits ?? 0;
				const totalCredits = existing?.totalCredits ?? 0;

				let nextOwed = owed;
				let nextDebits = totalDebits;
				let nextCredits = totalCredits;

				if (isDebit) {
					nextOwed = owed + input.amount;
					nextDebits = totalDebits + input.amount;
				} else if (isCreditIn) {
					nextOwed = Math.max(0, owed - input.amount); // clamp ≥ 0
					nextCredits = totalCredits + input.amount;
				}
				// credit/out (refund) leaves AR untouched in Phase 1 (a compensating
				// debit, if needed, is posted explicitly — see budget-redesign.md §3).

				nextOrg = OrgBalanceSchema.parse({
					organizationId: input.organizationId,
					owed: nextOwed,
					totalDebits: nextDebits,
					totalCredits: nextCredits,
					currency: "ILS",
					updatedAt: now,
					companyId: input.companyId,
					storeId: input.storeId,
				});
			}

			// Revenue rollup — only money flow (credits). Debits are accruals, not revenue.
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
			if (orgRef && nextOrg) txn.set(orgRef, nextOrg);
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
		kind: input.kind,
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
