import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { StoredEvent, StoredEventSchema } from "./types";

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
