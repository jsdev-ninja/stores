import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { FirebaseAPI, TOrder } from "@jsdev_ninja/core";
import { subscribe } from "../../../platform/eventBus";
import {
  DocumentEventTypes,
  DocumentDeliveryNoteCreatedPayload,
} from "../../documents/events";
import { postTransaction } from "../services/postTransaction";

/**
 * Subscribes to documents.delivery_note_created and posts a DEBIT transaction
 * for B2B (organization) orders on credit terms.
 *
 * This is the cornerstone of the budget redesign: debt is incurred at
 * FULFILLMENT (when the delivery note is issued), on the FINAL picked amount —
 * never at order placement. The amount is read from the server-side order doc
 * (cart.cartTotal, which reflects the post-picking total), not the event
 * payload, so a spoofed/replayed event cannot inflate debt.
 *
 * B2C orders (no organizationId) pay at point of sale and carry no
 * accounts-receivable, so they are skipped.
 *
 * Idempotency: subscriber dedup key `evt_{name}_{eventId}` ensures one debit
 * per delivery-note-created event (re-delivery is an idempotent no-op).
 */
export const postDebitOnDeliveryNoteCreated = subscribe(
  {
    name: "ledger-post-debit-on-delivery-note-created",
    type: DocumentEventTypes.deliveryNoteCreated,
    payloadSchema: DocumentDeliveryNoteCreatedPayload,
  },
  async (event, ctx) => {
    const { payload } = event;
    const { companyId, storeId, eventId } = ctx;

    logger.info("ledger.postDebitOnDeliveryNoteCreated: received", {
      eventId,
      orderId: payload.orderId,
      deliveryNoteId: payload.deliveryNoteId ?? null,
      organizationId: payload.organizationId ?? null,
      companyId,
      storeId,
    });

    // Skip B2C — no organization means no accounts-receivable debt.
    if (!payload.organizationId) {
      logger.info(
        "ledger.postDebitOnDeliveryNoteCreated: no organizationId, skipping (B2C)",
        { eventId, orderId: payload.orderId, companyId, storeId },
      );
      return;
    }

    // Read the server-side order doc for the authoritative fulfilled amount.
    const db = admin.firestore();
    const orderPath = FirebaseAPI.firestore.getPath({
      companyId,
      storeId,
      collectionName: "orders",
      id: payload.orderId,
    });

    const orderSnap = await db.doc(orderPath).get();
    if (!orderSnap.exists) {
      // Throw so the event bus retries (read-after-write propagation lag).
      throw new Error(
        `ledger.postDebitOnDeliveryNoteCreated: order not found: ${payload.orderId} — will retry`,
      );
    }

    const order = orderSnap.data() as TOrder;

    // Cross-check organizationId against the server doc (security invariant).
    if (!order.organizationId) {
      logger.info(
        "ledger.postDebitOnDeliveryNoteCreated: server order has no organizationId, skipping",
        { eventId, orderId: payload.orderId, companyId, storeId },
      );
      return;
    }

    // TODO(money-units): cart.cartTotal is stored in SHEKELS (ILS floats) across
    // current + legacy order docs, while the ledger standardizes on integer
    // agorot. Convert ILS→agorot here at the subscriber boundary. Once orders
    // store agorot upstream, drop the *100. See CLAUDE.md "Money".
    const cartTotalShekels = order.cart?.cartTotal;
    if (
      typeof cartTotalShekels !== "number" ||
      !Number.isFinite(cartTotalShekels) ||
      cartTotalShekels <= 0
    ) {
      logger.error(
        "ledger.postDebitOnDeliveryNoteCreated: cart.cartTotal is not a positive number — skipping",
        {
          eventId,
          orderId: payload.orderId,
          cartTotal: cartTotalShekels,
          companyId,
          storeId,
        },
      );
      // Don't throw — log and skip to avoid poisoning the event queue.
      return;
    }

    const amount = Math.round(cartTotalShekels * 100); // shekels → agorot

    const deliveryNoteId =
      payload.deliveryNoteId ?? payload.deliveryNoteNumber ?? payload.orderId;

    const tx = await postTransaction({
      source: "subscriber",
      subscriberName: "ledger-post-debit-on-delivery-note-created",
      eventId,
      kind: "debit",
      type: "delivery_note",
      amount,
      currency: "ILS",
      direction: "none",
      reference: { type: "order", id: order.id },
      document: {
        type: "delivery_note",
        id: deliveryNoteId,
        ...(payload.deliveryNoteNumber
          ? { number: payload.deliveryNoteNumber }
          : {}),
      },
      payer: {
        organizationId: order.organizationId,
        ...(order.client?.id ? { clientId: order.client.id } : {}),
        ...(order.billingAccount?.id
          ? { billingAccountId: order.billingAccount.id }
          : {}),
      },
      companyId,
      storeId,
    });

    logger.info("ledger.postDebitOnDeliveryNoteCreated: done", {
      eventId,
      orderId: order.id,
      transactionId: tx.id,
      organizationId: order.organizationId,
      amount,
      companyId,
      storeId,
    });
  },
);
