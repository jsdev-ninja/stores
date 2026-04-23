import admin from "firebase-admin";
import { z } from "zod";
import { logger } from "firebase-functions/v2";
import { emit, subscribe, StoredEvent } from "./index";

// ──────────────────────────────────────────────────────────────
// 0. Each module owns its event-type constants — no central registry.
//    Format "module.action" enforced by the platform schema.
// ──────────────────────────────────────────────────────────────

const OrderEvents = {
	placed: "order.placed",
	cancelled: "order.cancelled",
	fulfilled: "order.fulfilled",
} as const;

// ──────────────────────────────────────────────────────────────
// 1. Declare the payload schema for an event the module publishes.
//    Lives in the emitting module, e.g. modules/orders/events.ts
// ──────────────────────────────────────────────────────────────

const OrderPlacedPayload = z.object({
	orderId: z.string(),
	total: z.number(),
	customerEmail: z.string().email(),
});

type OrderPlacedPayload = z.infer<typeof OrderPlacedPayload>;

// ──────────────────────────────────────────────────────────────
// 2. Emit inside the existing transaction that writes state.
//    Never call emit outside a transaction — write and event
//    must be atomic (outbox pattern).
// ──────────────────────────────────────────────────────────────

async function placeOrderExample(
	orderRef: FirebaseFirestore.DocumentReference,
	input: {
		companyId: string;
		storeId: string;
		userId: string;
		payload: OrderPlacedPayload;
	},
) {
	const db = admin.firestore();

	await db.runTransaction(async (tx) => {
		tx.update(orderRef, { status: "placed" });

		const placedEvent = emit<OrderPlacedPayload>(tx, {
			type: OrderEvents.placed,
			payload: input.payload,
			companyId: input.companyId,
			storeId: input.storeId,
			actorId: `user:${input.userId}`,
			source: "orders",
		});
		// placedEvent.id, placedEvent.correlationId, etc. available for downstream use
	});
}

// ──────────────────────────────────────────────────────────────
// 3. Subscribe — lives in the reacting module, e.g.
//    modules/fulfillment/subscribers.ts. Exported as a trigger
//    from functions/src/index.tsx so Firebase deploys it.
// ──────────────────────────────────────────────────────────────

export const exampleCreateDeliveryNoteOnOrderPlaced = subscribe(
	{
		name: "delivery-note-creator",
		type: OrderEvents.placed,
		payloadSchema: OrderPlacedPayload,
	},
	async (event: StoredEvent<OrderPlacedPayload>, ctx) => {
		const db = admin.firestore();
		const deliveryNoteRef = db.doc(
			`${ctx.companyId}/${ctx.storeId}/delivery_notes/${event.payload.orderId}`,
		);

		// Natural-key idempotency: document is keyed by orderId.
		// If the subscriber retries, the second create fails with ALREADY_EXISTS
		// and we no-op.
		try {
			await deliveryNoteRef.create({
				orderId: event.payload.orderId,
				total: event.payload.total,
				createdAt: Date.now(),
			});
		} catch (err: unknown) {
			if ((err as { code?: number }).code === 6) return;
			throw err;
		}
	},
);

// ──────────────────────────────────────────────────────────────
// 4. Propagating correlationId — every downstream emit must copy
//    the incoming event's correlationId so the whole chain is
//    queryable with a single where("correlationId", "==", X).
// ──────────────────────────────────────────────────────────────

export const exampleFulfillmentPropagatesTrace = subscribe(
	{
		name: "fulfillment-propagates-trace",
		type: OrderEvents.placed,
		payloadSchema: OrderPlacedPayload,
	},
	async (event, ctx) => {
		const db = admin.firestore();

		await db.runTransaction(async (tx) => {
			// ... do work ...

			const downstream = emit(tx, {
				type: "fulfillment.delivery_note_created",
				payload: { orderId: event.payload.orderId },
				companyId: ctx.companyId,
				storeId: ctx.storeId,
				correlationId: event.correlationId,
				source: "fulfillment",
			});
			logger.info("fulfillment.downstream_emitted", {
				downstreamEventId: downstream.id,
				correlationId: downstream.correlationId,
			});
		});
	},
);
