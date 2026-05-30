import admin from "firebase-admin";

/**
 * Discriminated union by source — forces the right dedup key at compile time.
 * For source:"system" no dedup key is required; an auto-generated id is used.
 */
export type DocIdInput =
	| { source: "subscriber"; subscriberName: string; eventId: string }
	| { source: "api"; idempotencyKey: string }
	| { source: "hyp_result"; hypTransactionId: string }
	| { source: "system" };

/**
 * Returns a { docId, dedupKey } pair.
 *
 * - subscriber  → `evt_{subscriberName}_{eventId}`
 * - api         → `idem_{idempotencyKey}`
 * - hyp_result  → `hyp_{hypTransactionId}`   (used by recordHypJ5Auth + recordHypDirectPayment)
 * - system      → auto-generated Firestore id, dedupKey === docId
 */
export function transactionDocId(input: DocIdInput): {
	docId: string;
	dedupKey: string;
} {
	switch (input.source) {
		case "subscriber": {
			const dedupKey = `evt_${input.subscriberName}_${input.eventId}`;
			return { docId: dedupKey, dedupKey };
		}
		case "api": {
			const dedupKey = `idem_${input.idempotencyKey}`;
			return { docId: dedupKey, dedupKey };
		}
		case "hyp_result": {
			const dedupKey = `hyp_${input.hypTransactionId}`;
			return { docId: dedupKey, dedupKey };
		}
		case "system": {
			const docId = admin.firestore().collection("_").doc().id;
			return { docId, dedupKey: docId };
		}
	}
}
