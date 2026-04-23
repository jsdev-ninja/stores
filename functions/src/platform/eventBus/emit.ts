import admin from "firebase-admin";
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
	StoredEventSchema.parse({ ...stored, payload: stored.payload });

	tx.set(ref, stored);
	return stored;
}
