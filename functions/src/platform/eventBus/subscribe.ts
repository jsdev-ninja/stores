import { onDocumentCreated } from "firebase-functions/v2/firestore";
import type { DocumentOptions } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import { ZodType } from "zod";
import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { StoredEvent, StoredEventSchema } from "./types";
import { eventBusAttemptsPath, eventBusDeadLetterPath } from "./paths";

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
    maxAttempts?: number;
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

      const maxAttempts = options.maxAttempts ?? MAX_ATTEMPTS;
      const db = admin.firestore();
      const attemptsRef = db.doc(
        eventBusAttemptsPath(companyId, storeId, options.name, eventId),
      );
      const dlqRef = db.doc(
        eventBusDeadLetterPath(companyId, storeId, options.name, eventId),
      );

      const attemptsSnap = await attemptsRef.get();
      const priorAttempts = attemptsSnap.exists
        ? ((attemptsSnap.data()?.attempts as number | undefined) ?? 0)
        : 0;
      const priorErrors = attemptsSnap.exists
        ? ((attemptsSnap.data()?.errors as AttemptError[] | undefined) ?? [])
        : [];

      // Prior invocations already exhausted the budget (e.g. they OOM-crashed before they could
      // dead-letter). Dead-letter now and STOP — do not run the handler again.
      if (priorAttempts >= maxAttempts) {
        await dlqRef.set(
          {
            subscriberName: options.name,
            eventId,
            eventType: options.type,
            companyId,
            storeId,
            attempts: priorAttempts,
            errors: priorErrors,
            droppedAt: Date.now(),
            originalEvent: envelope,
          },
          { merge: true },
        );
        await attemptsRef.delete().catch((e) =>
          logger.warn("eventBus.subscriber.attemptCleanupFailed", {
            subscriber: options.name,
            eventId,
            err: describeError(e),
          }),
        );
        logger.error("eventBus.subscriber.deadLettered", {
          subscriber: options.name,
          eventId,
          eventType: options.type,
          companyId,
          storeId,
          attempts: priorAttempts,
          lastError: priorErrors[priorErrors.length - 1]?.message ?? null,
        });
        return;
      }

      const attemptNumber = priorAttempts + 1;

      // Claim the attempt BEFORE running the handler so a hard crash (OOM) still counts.
      await attemptsRef.set(
        {
          attempts: attemptNumber,
          lastAttemptAt: Date.now(),
          ...(attemptsSnap.exists
            ? {}
            : {
                subscriberName: options.name,
                eventId,
                eventType: options.type,
                firstAttemptAt: Date.now(),
              }),
        },
        { merge: true },
      );

      logger.info("eventBus.subscriber.received", {
        subscriber: options.name,
        eventId,
        eventType: options.type,
        companyId,
        storeId,
        attempt: attemptNumber,
      });

      try {
        await handler(event, { companyId, storeId, eventId });
        await attemptsRef.delete().catch((e) =>
          logger.warn("eventBus.subscriber.attemptCleanupFailed", {
            subscriber: options.name,
            eventId,
            err: describeError(e),
          }),
        );
      } catch (err) {
        const errorEntry: AttemptError = {
          attempt: attemptNumber,
          message: describeError(err),
          at: Date.now(),
        };

        if (attemptNumber >= maxAttempts) {
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
          await attemptsRef.delete().catch((e) =>
            logger.warn("eventBus.subscriber.attemptCleanupFailed", {
              subscriber: options.name,
              eventId,
              err: describeError(e),
            }),
          );
          logger.error("eventBus.subscriber.deadLettered", {
            subscriber: options.name,
            eventId,
            eventType: options.type,
            companyId,
            storeId,
            attempts: attemptNumber,
            lastError: errorEntry.message,
          });
          return; // swallow — do not retry past max
        }

        await attemptsRef.set({ errors: FieldValue.arrayUnion(errorEntry) }, { merge: true });

        logger.error("eventBus.subscriber.error", {
          subscriber: options.name,
          eventId,
          eventType: options.type,
          companyId,
          storeId,
          attempt: attemptNumber,
          err: errorEntry.message,
        });

        throw err; // trigger Cloud Functions retry
      }
    },
  );
}
