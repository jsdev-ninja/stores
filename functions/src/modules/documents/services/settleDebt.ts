import { logger } from "firebase-functions/v2";
import { writeArEntry } from "../internal/organizationBalanceStore";
import { settlementEntryId } from "../internal/docIds";

// ---------------------------------------------------------------------------
// settleDebt — post a "-" settlement entry, reducing an org's AR balance
// ---------------------------------------------------------------------------

export type SettleDebtInput = {
	organizationId: string;
	/** Integer agorot (always positive) */
	amount: number;
	/** Ledger transaction id that funded this settlement */
	transactionId: string;
	billingAccountId?: string | null;
	/** Event id from the ledger.transaction_posted event — used as dedup key */
	causedByEventId: string;
	companyId: string;
	storeId: string;
};

export type SettleDebtResult = { applied: boolean };

/**
 * Post a "-" settlement entry for a B2B org's AR.
 *
 * Idempotent: the entry doc id is `settle_{transactionId}`. A second call with the
 * same transactionId is a no-op (ALREADY_EXISTS guard). Keying on transactionId
 * (not eventId) means event re-delivery / backfill cannot double-settle.
 *
 * This service is entry-point-agnostic — called from subscribers or other services.
 */
export async function settleDebt(input: SettleDebtInput): Promise<SettleDebtResult> {
	const entryId = settlementEntryId(input.transactionId);

	logger.info("documents.settleDebt: posting settlement", {
		entryId,
		organizationId: input.organizationId,
		amount: input.amount,
		transactionId: input.transactionId,
		causedByEventId: input.causedByEventId,
		companyId: input.companyId,
		storeId: input.storeId,
	});

	const result = await writeArEntry({
		entryId,
		organizationId: input.organizationId,
		sign: "-",
		kind: "settlement",
		amount: input.amount,
		source: "ledger_payment",
		reference: {
			type: "transaction",
			id: input.transactionId,
		},
		billingAccountId: input.billingAccountId ?? null,
		causedByEventId: input.causedByEventId,
		companyId: input.companyId,
		storeId: input.storeId,
	});

	if (!result.written) {
		logger.info("documents.settleDebt: idempotent replay (entry already exists)", {
			entryId,
			organizationId: input.organizationId,
			companyId: input.companyId,
			storeId: input.storeId,
		});
		return { applied: false };
	}

	logger.info("documents.settleDebt: done", {
		entryId,
		organizationId: input.organizationId,
		amount: input.amount,
		owed: result.rollup.owed,
		totalSettled: result.rollup.totalSettled,
		companyId: input.companyId,
		storeId: input.storeId,
	});

	return { applied: true };
}
