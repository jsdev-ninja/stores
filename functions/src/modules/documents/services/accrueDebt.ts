import { logger } from "firebase-functions/v2";
import { writeArEntry } from "../internal/organizationBalanceStore";
import { deliveryNoteEntryId } from "../internal/docIds";

// ---------------------------------------------------------------------------
// accrueDebt — post a "+" AR accrual entry for an organization
// ---------------------------------------------------------------------------

export type AccrueDebtInput = {
	organizationId: string;
	/** Integer agorot (always positive) */
	amount: number;
	deliveryNoteId: string;
	deliveryNoteNumber?: string;
	orderId: string;
	billingAccountId?: string | null;
	causedByEventId?: string;
	companyId: string;
	storeId: string;
};

export type AccrueDebtResult = { applied: boolean };

/**
 * Post a "+" accrual entry for a B2B org's AR.
 *
 * Idempotent: the entry doc id is `dn_{deliveryNoteId}`. A second call with the
 * same deliveryNoteId is a no-op (ALREADY_EXISTS guard in organizationBalanceStore).
 *
 * This service is entry-point-agnostic: it can be called from a subscriber,
 * an API callable, or another service.
 */
export async function accrueDebt(input: AccrueDebtInput): Promise<AccrueDebtResult> {
	const entryId = deliveryNoteEntryId(input.deliveryNoteId);

	logger.info("documents.accrueDebt: posting accrual", {
		entryId,
		organizationId: input.organizationId,
		amount: input.amount,
		deliveryNoteId: input.deliveryNoteId,
		orderId: input.orderId,
		companyId: input.companyId,
		storeId: input.storeId,
	});

	const result = await writeArEntry({
		entryId,
		organizationId: input.organizationId,
		sign: "+",
		kind: "accrual",
		amount: input.amount,
		source: "delivery_note",
		document: {
			type: "delivery_note",
			id: input.deliveryNoteId,
			...(input.deliveryNoteNumber ? { number: input.deliveryNoteNumber } : {}),
		},
		reference: {
			type: "order",
			id: input.orderId,
		},
		billingAccountId: input.billingAccountId ?? null,
		causedByEventId: input.causedByEventId,
		companyId: input.companyId,
		storeId: input.storeId,
	});

	if (!result.written) {
		logger.info("documents.accrueDebt: idempotent replay (entry already exists)", {
			entryId,
			organizationId: input.organizationId,
			companyId: input.companyId,
			storeId: input.storeId,
		});
		return { applied: false };
	}

	logger.info("documents.accrueDebt: done", {
		entryId,
		organizationId: input.organizationId,
		amount: input.amount,
		owed: result.rollup.owed,
		totalAccrued: result.rollup.totalAccrued,
		companyId: input.companyId,
		storeId: input.storeId,
	});

	return { applied: true };
}
