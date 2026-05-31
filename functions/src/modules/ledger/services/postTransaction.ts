import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { emit } from "../../../platform/eventBus";
import { Transaction, TransactionSchema } from "../types";
import { LedgerEventTypes, TransactionPostedPayload } from "../events";
import { transactionDocId, DocIdInput } from "../internal/docIds";
import { transactionDocPath } from "../internal/paths";
import { detectDuplicateCharges } from "./detectDuplicateCharges";

const db = () => admin.firestore();

/** gRPC ALREADY_EXISTS status codes (numeric 6 or string 'already-exists') */
function isAlreadyExists(err: unknown): boolean {
	const e = err as { code?: number | string };
	return e.code === 6 || e.code === "already-exists";
}

// ---------------------------------------------------------------------------
// Input type — discriminated union forces correct dedup key at compile time
// ---------------------------------------------------------------------------

type TransactionData = Omit<
	Transaction,
	"id" | "dedupKey" | "actor" | "source" | "causedByEventId" | "createdAt"
>;

export type PostTransactionInput = TransactionData &
	(
		| {
				source: "subscriber";
				eventId: string;
				subscriberName: string;
		  }
		| {
				source: "api";
				idempotencyKey: string;
				actor: { type: "user"; userId: string };
		  }
		| {
				/**
				 * Customer-facing HYP redirect result.
				 * Used by recordHypJ5Auth and recordHypDirectPayment.
				 * Dedup key: hyp_{verifiedHypTransactionId}
				 */
				source: "hyp_result";
				hypTransactionId: string;
		  }
		| {
				source: "system";
		  }
	);

// ---------------------------------------------------------------------------
// postTransaction — the ONLY writer of Transaction documents
// ---------------------------------------------------------------------------

export async function postTransaction(
	input: PostTransactionInput,
): Promise<Transaction> {
	const docIdInput = buildDocIdInput(input);
	const { docId, dedupKey } = transactionDocId(docIdInput);

	const actor = buildActor(input);
	const causedByEventId =
		input.source === "subscriber" ? input.eventId : undefined;

	const tx: Transaction = TransactionSchema.parse({
		id: docId,
		type: input.type,
		amount: input.amount,
		currency: input.currency,
		direction: input.direction,
		reference: input.reference,
		payer: input.payer,
		hyp: input.hyp,
		clientName: input.clientName,
		email: input.email,
		actor,
		dedupKey,
		source: input.source,
		causedByEventId,
		createdAt: Date.now(),
		companyId: input.companyId,
		storeId: input.storeId,
	});

	const ref = db().doc(transactionDocPath(tx.companyId, tx.storeId, tx.id));
	const actorId = actor.type === "user" ? actor.userId : actor.type;

	let created = false;
	let storedTx: Transaction = tx;

	// Write transaction doc and emit event atomically in a single Firestore transaction.
	// tx.create() throws ALREADY_EXISTS (gRPC 6 or 'already-exists') on duplicate delivery —
	// we catch it as an idempotent no-op and fetch the existing doc.
	try {
		await db().runTransaction(async (fsxn) => {
			// Attempt create inside the transaction — throws on ALREADY_EXISTS
			fsxn.create(ref, tx);

			// Emit event in the same transaction — atomic with the doc write
			const eventPayload: TransactionPostedPayload = {
				transactionId: tx.id,
				type: tx.type,
				amount: tx.amount,
				direction: tx.direction,
				reference: tx.reference,
				// Forward payer so budget subscriber can reduce org debt without
				// an extra Firestore read.
				payer: tx.payer,
			};

			emit<TransactionPostedPayload>(fsxn, {
				type: LedgerEventTypes.transactionPosted,
				source: "ledger",
				companyId: tx.companyId,
				storeId: tx.storeId,
				actorId,
				payload: eventPayload,
			});

			created = true;
		});
	} catch (err: unknown) {
		if (isAlreadyExists(err)) {
			logger.info("ledger.postTransaction.idempotentReplay", {
				txId: tx.id,
				dedupKey,
				companyId: tx.companyId,
				storeId: tx.storeId,
			});
			const snap = await ref.get();
			storedTx = snap.data() as Transaction;
			created = false;
		} else {
			throw err;
		}
	}

	// detectDuplicateCharges is a best-effort side effect — runs AFTER the
	// atomic write commits, never inside it, so a detection failure can't
	// roll back the money write.
	if (created) {
		const shouldDetectDuplicate =
			(tx.type === "hyp_direct" || tx.type === "hyp_capture") &&
			tx.direction === "in" &&
			tx.reference?.type === "order";

		if (shouldDetectDuplicate && tx.reference?.type === "order") {
			await detectDuplicateCharges({
				companyId: tx.companyId,
				storeId: tx.storeId,
				orderId: tx.reference.id,
			});
		}
	}

	return storedTx;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDocIdInput(input: PostTransactionInput): DocIdInput {
	switch (input.source) {
		case "subscriber":
			return {
				source: "subscriber",
				subscriberName: input.subscriberName,
				eventId: input.eventId,
			};
		case "api":
			return { source: "api", idempotencyKey: input.idempotencyKey };
		case "hyp_result":
			return {
				source: "hyp_result",
				hypTransactionId: input.hypTransactionId,
			};
		case "system":
			return { source: "system" };
	}
}

function buildActor(input: PostTransactionInput): Transaction["actor"] {
	switch (input.source) {
		case "api":
			return input.actor;
		case "hyp_result":
			return { type: "customer" };
		case "subscriber":
		case "system":
			return { type: "system" };
	}
}
