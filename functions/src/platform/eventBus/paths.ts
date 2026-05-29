// Pure string-builders for event-bus infrastructure collections.

/**
 * Per-subscriber, per-event attempt counter doc.
 * Lives until the event is successfully processed or dead-lettered.
 */
export function eventBusAttemptsPath(
	companyId: string,
	storeId: string,
	subscriberName: string,
	eventId: string,
): string {
	return `${companyId}/${storeId}/eventBusAttempts/${subscriberName}_${eventId}`;
}

/**
 * Collection where events that exhausted their retry budget land.
 * One doc per (subscriber, event) pair that gave up.
 */
export function eventBusDeadLetterCollectionPath(companyId: string, storeId: string): string {
	return `${companyId}/${storeId}/eventBusDeadLetter`;
}

/**
 * Single dead-letter doc, deterministic ID so concurrent retries hitting the cap
 * at the same instant collapse to one row instead of duplicates.
 */
export function eventBusDeadLetterPath(
	companyId: string,
	storeId: string,
	subscriberName: string,
	eventId: string,
): string {
	return `${eventBusDeadLetterCollectionPath(companyId, storeId)}/${subscriberName}_${eventId}`;
}
