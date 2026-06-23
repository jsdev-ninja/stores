// ---------------------------------------------------------------------------
// Deterministic AR entry doc id builders.
// Every writer derives the doc id from a stable dedup key so that
// Firestore .create() → ALREADY_EXISTS is the idempotency gate.
// ---------------------------------------------------------------------------

/**
 * Accrual entry for a delivery note.
 * One entry per delivery note — redelivery of the same event is a no-op.
 */
export function deliveryNoteEntryId(deliveryNoteId: string): string {
	return `dn_${deliveryNoteId}`;
}

/**
 * Settlement entry keyed on the TRANSACTION ID (not the event id).
 *
 * Using the transactionId means a re-delivered `transaction_posted` event (replay
 * or backfill) results in a no-op: the entry already exists and `.create()` returns
 * ALREADY_EXISTS. If we keyed on eventId, a new event delivery would get a new id
 * and double-settle the org's AR.
 */
export function settlementEntryId(transactionId: string): string {
	return `settle_${transactionId}`;
}
