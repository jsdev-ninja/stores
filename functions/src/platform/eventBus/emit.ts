import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { StoredEvent, StoredEventSchema } from "./types";

/**
 * Standalone emit. Wraps emit() in its own Firestore transaction and swallows failures
 * (logs them) so an emit error never breaks the parent flow.
 *
 * Use this from any place that doesn't already have a transaction context.
 * If you DO have a transaction (and want the event to be atomic with your business writes),
 * call emit(tx, ...) directly instead.
 */
export async function emitEvent<T = unknown>(
	event: Omit<StoredEvent<T>, "id" | "createdAt">,
): Promise<void> {
	try {
		await admin.firestore().runTransaction(async (tx) => {
			emit(tx, event);
		});
	} catch (err) {
		logger.error("eventBus.emit.failed", {
			type: event.type,
			companyId: event.companyId,
			storeId: event.storeId,
			source: event.source,
			err,
		});
	}
}

export function emit<T = unknown>(
	tx: FirebaseFirestore.Transaction,
	event: Omit<StoredEvent<T>, "id" | "createdAt">,
): StoredEvent<T> {
	const db = admin.firestore();
	const path = `${event.companyId}/${event.storeId}/events`;
	const ref = db.collection(path).doc();

	const stored: StoredEvent<T> = {
		...event,
		id: ref.id,
		createdAt: Date.now(),
		correlationId: event.correlationId ?? ref.id,
	};

	// Validate the full envelope before writing. Throws ZodError on invalid input.
	StoredEventSchema.parse(stored);

	tx.set(ref, stored);

	logger.info(
		`emit ${stored.type}`,
		{
			category: "eventBus.emit",
			eventId: stored.id,
			eventType: stored.type,
			correlationId: stored.correlationId,
			companyId: stored.companyId,
			storeId: stored.storeId,
			source: stored.source,
			actorId: stored.actorId,
		},
	);

	return stored;
}
