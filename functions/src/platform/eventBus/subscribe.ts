import { onDocumentCreated } from "firebase-functions/v2/firestore";
import type { DocumentOptions } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import { ZodType } from "zod";
import { StoredEvent, StoredEventSchema } from "./types";

type SubscriberContext = {
	companyId: string;
	storeId: string;
	eventId: string;
};

export function subscribe<T>(
	options: {
		name: string;
		type: string;
		payloadSchema: ZodType<T>;
		functionOptions?: Omit<DocumentOptions, "document" | "retry">;
	},
	handler: (event: StoredEvent<T>, ctx: SubscriberContext) => Promise<void>,
) {
	return onDocumentCreated(
		{
			...options.functionOptions,
			document: "{companyId}/{storeId}/events/{id}",
			retry: true,
		},
		async (firestoreEvent) => {
			const snap = firestoreEvent.data;
			if (!snap) return;

			const data = snap.data() as unknown;
			const { companyId, storeId, id: eventId } = firestoreEvent.params;

			const envelopeResult = StoredEventSchema.safeParse(data);
			if (!envelopeResult.success) {
				logger.error("eventBus.subscriber.envelopeInvalid", {
					subscriber: options.name,
					eventId,
					companyId,
					storeId,
					issues: envelopeResult.error.issues,
				});
				return;
			}

			const envelope = envelopeResult.data;
			if (envelope.type !== options.type) return;

			const payloadResult = options.payloadSchema.safeParse(envelope.payload);
			if (!payloadResult.success) {
				logger.error("eventBus.subscriber.payloadInvalid", {
					subscriber: options.name,
					eventId,
					eventType: options.type,
					companyId,
					storeId,
					issues: payloadResult.error.issues,
				});
				return;
			}

			const event: StoredEvent<T> = {
				...envelope,
				payload: payloadResult.data,
			};

			logger.info("eventBus.subscriber.received", {
				subscriber: options.name,
				eventId,
				eventType: options.type,
				companyId,
				storeId,
			});

			try {
				await handler(event, { companyId, storeId, eventId });
			} catch (err) {
				logger.error("eventBus.subscriber.error", {
					subscriber: options.name,
					eventId,
					eventType: options.type,
					companyId,
					storeId,
					err,
				});
				throw err;
			}
		},
	);
}
