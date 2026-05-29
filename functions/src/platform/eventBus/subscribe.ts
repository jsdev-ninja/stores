import { onDocumentCreated } from "firebase-functions/v2/firestore";
import type { DocumentOptions } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import { ZodType } from "zod";
import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { StoredEvent, StoredEventSchema } from "./types";
import {
  eventBusAttemptsPath,
  eventBusDeadLetterPath,
} from "./paths";

type SubscriberContext = {
  companyId: string;
  storeId: string;
  eventId: string;
};

/** Max delivery attempts before the event is dead-lettered. */
const MAX_ATTEMPTS = 5;

/** Trim each error message so the attempts doc stays well under Firestore's 1MB cap. */
const MAX_ERROR_MESSAGE_LENGTH = 1000;

type AttemptError = {
  attempt: number;
  message: string;
  at: number;
};

function describeError(err: unknown): string {
  const raw = err instanceof Error ? (err.stack ?? err.message) : String(err);
  return raw.length > MAX_ERROR_MESSAGE_LENGTH
    ? raw.slice(0, MAX_ERROR_MESSAGE_LENGTH) + "…[truncated]"
    : raw;
}

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

      const db = admin.firestore();
      const attemptsRef = db.doc(
        eventBusAttemptsPath(companyId, storeId, options.name, eventId),
      );

      const attemptsSnap = await attemptsRef.get();
      const priorAttempts = attemptsSnap.exists
        ? ((attemptsSnap.data()?.attempts as number | undefined) ?? 0)
        : 0;
      const priorErrors = attemptsSnap.exists
        ? ((attemptsSnap.data()?.errors as AttemptError[] | undefined) ?? [])
        : [];

      logger.info("eventBus.subscriber.received", {
        subscriber: options.name,
        eventId,
        eventType: options.type,
        companyId,
        storeId,
        attempt: priorAttempts + 1,
      });

      try {
        await handler(event, { companyId, storeId, eventId });
        if (attemptsSnap.exists) {
          await attemptsRef.delete().catch((cleanupErr) => {
            logger.warn("eventBus.subscriber.attemptCleanupFailed", {
              subscriber: options.name,
              eventId,
              err: describeError(cleanupErr),
            });
          });
        }
      } catch (err) {
        const attemptNumber = priorAttempts + 1;
        const errorEntry: AttemptError = {
          attempt: attemptNumber,
          message: describeError(err),
          at: Date.now(),
        };

        if (attemptNumber >= MAX_ATTEMPTS) {
          const dlqRef = db.doc(
            eventBusDeadLetterPath(companyId, storeId, options.name, eventId),
          );
          await dlqRef.set(
            {
              subscriberName: options.name,
              eventId,
              eventType: options.type,
              companyId,
              storeId,
              attempts: attemptNumber,
              errors: [...priorErrors, errorEntry],
              droppedAt: Date.now(),
              originalEvent: envelope,
            },
            { merge: true },
          );
          await attemptsRef.delete().catch(() => {});
          logger.error("eventBus.subscriber.deadLettered", {
            subscriber: options.name,
            eventId,
            eventType: options.type,
            companyId,
            storeId,
            attempts: attemptNumber,
            lastError: errorEntry.message,
          });
          return;
        }

        const updates: Record<string, unknown> = {
          attempts: FieldValue.increment(1),
          errors: FieldValue.arrayUnion(errorEntry),
          lastAttemptAt: Date.now(),
        };
        if (!attemptsSnap.exists) {
          updates.subscriberName = options.name;
          updates.eventId = eventId;
          updates.eventType = options.type;
          updates.firstAttemptAt = Date.now();
        }
        await attemptsRef.set(updates, { merge: true });

        logger.error("eventBus.subscriber.error", {
          subscriber: options.name,
          eventId,
          eventType: options.type,
          companyId,
          storeId,
          attempt: attemptNumber,
          err: errorEntry.message,
        });

        throw err;
      }
    },
  );
}
