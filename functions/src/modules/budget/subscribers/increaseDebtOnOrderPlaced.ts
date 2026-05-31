import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { FirebaseAPI, TOrder } from "@jsdev_ninja/core";
import { subscribe } from "../../../platform/eventBus";
import { OrderEventTypes, OrderPlacedPayload } from "../../orders/events";
import { applyBudgetEvent } from "../services/applyBudgetEvent";

/**
 * Subscribe to order.placed and create a debt_increase record for B2B orders.
 *
 * Security: amount comes from the SERVER-READ order doc (cart.cartTotal),
 * NOT from the event payload, so a spoofed/replayed event cannot inflate debt.
 * The event's organizationId is cross-checked against the order doc.
 */
export const increaseDebtOnOrderPlaced = subscribe(
	{
		name: "budget-increase-debt-on-order-placed",
		type: OrderEventTypes.placed,
		payloadSchema: OrderPlacedPayload,
	},
	async (event, ctx) => {
		const { payload } = event;
		const { companyId, storeId, eventId } = ctx;

		logger.info("budget.increaseDebtOnOrderPlaced: received", {
			eventId,
			orderId: payload.orderId,
			organizationId: payload.organizationId ?? null,
			companyId,
			storeId,
		});

		// Skip B2C orders
		if (!payload.organizationId) {
			logger.info("budget.increaseDebtOnOrderPlaced: no organizationId, skipping (B2C)", {
				eventId,
				orderId: payload.orderId,
				companyId,
				storeId,
			});
			return;
		}

		// Read the server-side order doc for the authoritative amount + customer data
		const db = admin.firestore();
		const orderPath = FirebaseAPI.firestore.getPath({
			companyId,
			storeId,
			collectionName: "orders",
			id: payload.orderId,
		});

		const orderSnap = await db.doc(orderPath).get();
		if (!orderSnap.exists) {
			// Throw so the event bus retries (doc may not be readable yet)
			throw new Error(
				`budget.increaseDebtOnOrderPlaced: order not found: ${payload.orderId} — will retry`,
			);
		}

		const order = orderSnap.data() as TOrder;

		// Cross-check organizationId against the server doc (security invariant)
		if (!order.organizationId) {
			logger.info("budget.increaseDebtOnOrderPlaced: server order has no organizationId, skipping", {
				eventId,
				orderId: payload.orderId,
				companyId,
				storeId,
			});
			return;
		}

		const organizationId = order.organizationId;
		// Amount MUST come from the server-side order doc — never from the event payload
		const amount = order.cart.cartTotal;

		if (!Number.isInteger(amount) || amount <= 0) {
			logger.error("budget.increaseDebtOnOrderPlaced: cart.cartTotal is not a positive integer agorot", {
				eventId,
				orderId: payload.orderId,
				amount,
				companyId,
				storeId,
			});
			// Don't throw — log and skip to avoid poisoning the event queue
			return;
		}

		const organizationName =
			order.client?.companyName ??
			order.client?.displayName ??
			organizationId;

		const customerId = order.client?.id ?? "system";
		const customerName =
			order.client?.displayName ??
			order.client?.companyName ??
			"";

		const billingAccountId = order.billingAccount?.id ?? null;

		const { applied } = await applyBudgetEvent({
			companyId,
			storeId,
			organizationId,
			organizationName,
			customerId,
			customerName,
			billingAccountId,
			type: "debt_increase",
			amount,
			relatedId: payload.orderId,
			source: "order",
			causedByEventId: eventId,
		});

		logger.info("budget.increaseDebtOnOrderPlaced: done", {
			eventId,
			orderId: payload.orderId,
			organizationId,
			amount,
			applied,
			companyId,
			storeId,
		});
	},
);
