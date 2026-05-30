import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { Transaction } from "../types";
import { transactionsPath, transactionDocPath } from "./paths";

const db = () => admin.firestore();

/** gRPC ALREADY_EXISTS status codes (numeric 6 or string 'already-exists') */
function isAlreadyExists(err: unknown): boolean {
	const e = err as { code?: number | string };
	return e.code === 6 || e.code === "already-exists";
}

/**
 * Write a Transaction document using .create() for idempotent-safe insertion.
 *
 * Returns { created: true, tx } on first write.
 * Returns { created: false, tx } when the doc already exists (idempotent replay).
 * Throws on any other Firestore error.
 */
export async function createTransaction(
	tx: Transaction,
): Promise<{ created: boolean; tx: Transaction }> {
	const ref = db().doc(
		transactionDocPath(tx.companyId, tx.storeId, tx.id),
	);
	try {
		await ref.create(tx);
		return { created: true, tx };
	} catch (err: unknown) {
		if (isAlreadyExists(err)) {
			logger.info("ledger.transactionsStore.alreadyExists", {
				txId: tx.id,
				companyId: tx.companyId,
				storeId: tx.storeId,
				dedupKey: tx.dedupKey,
			});
			const snap = await ref.get();
			return { created: false, tx: snap.data() as Transaction };
		}
		throw err;
	}
}

export async function getTransactionById(
	companyId: string,
	storeId: string,
	txId: string,
): Promise<Transaction | null> {
	const snap = await db()
		.doc(transactionDocPath(companyId, storeId, txId))
		.get();
	if (!snap.exists) return null;
	return snap.data() as Transaction;
}

/**
 * Query all "in" hyp transactions (hyp_direct or hyp_capture) for a given order.
 * Used by detectDuplicateCharges.
 */
export async function queryHypInTransactionsByOrder(
	companyId: string,
	storeId: string,
	orderId: string,
): Promise<Transaction[]> {
	const snap = await db()
		.collection(transactionsPath(companyId, storeId))
		.where("reference.type", "==", "order")
		.where("reference.id", "==", orderId)
		.where("direction", "==", "in")
		.get();

	return snap.docs
		.map((d) => d.data() as Transaction)
		.filter(
			(t) => t.type === "hyp_direct" || t.type === "hyp_capture",
		);
}

/**
 * Query successful hyp_capture transactions for a given capturedFromTransactionId.
 * Used by captureHypJ5 to prevent double-charging.
 */
export async function queryCaptursByAuthTx(
	companyId: string,
	storeId: string,
	capturedFromTransactionId: string,
): Promise<Transaction[]> {
	const snap = await db()
		.collection(transactionsPath(companyId, storeId))
		.where(
			"hyp.capturedFromTransactionId",
			"==",
			capturedFromTransactionId,
		)
		.where("type", "==", "hyp_capture")
		.get();

	return snap.docs.map((d) => d.data() as Transaction);
}
