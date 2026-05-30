import { logger } from "firebase-functions/v2";
import { emitEvent } from "../../../platform/eventBus";
import { LedgerEventTypes, DuplicateChargeDetectedPayload } from "../events";
import { queryHypInTransactionsByOrder } from "../internal/transactionsStore";
import { writeDuplicateChargeAlert } from "../internal/duplicateChargeAlertsStore";

/**
 * After a hyp_* "in" transaction referencing an order is written, check
 * whether there is more than one such transaction for the same order.
 * If so, write a DuplicateChargeAlert and emit the event.
 *
 * This function catches and logs its own errors — a detection failure
 * must not roll back the transaction write.
 */
export async function detectDuplicateCharges(params: {
	companyId: string;
	storeId: string;
	orderId: string;
}): Promise<void> {
	const { companyId, storeId, orderId } = params;
	try {
		const hypTxs = await queryHypInTransactionsByOrder(
			companyId,
			storeId,
			orderId,
		);

		if (hypTxs.length <= 1) return;

		const transactionIds = hypTxs.map((t) => t.id);
		const detectedAt = Date.now();

		await writeDuplicateChargeAlert({
			orderId,
			transactionIds,
			detectedAt,
			companyId,
			storeId,
		});

		logger.error("ledger.duplicate_charge_detected", {
			orderId,
			companyId,
			storeId,
			transactionIds,
			count: transactionIds.length,
		});

		await emitEvent<DuplicateChargeDetectedPayload>({
			type: LedgerEventTypes.duplicateChargeDetected,
			source: "ledger",
			companyId,
			storeId,
			payload: { orderId, transactionIds },
		});
	} catch (err) {
		logger.error("ledger.detectDuplicateCharges.error", {
			orderId,
			companyId,
			storeId,
			err,
		});
	}
}
