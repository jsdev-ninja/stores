import { logger } from "firebase-functions/v2";
import { subscribe } from "../../../platform/eventBus";
import { OrderEventTypes, OrderCancelledPayload } from "../../orders/events";
import { applyShadowTransaction } from "../internal/shadowWrite";

export const onOrderCancelledShadow = subscribe(
	{
		name: "budget-shadow-on-order-cancelled",
		type: OrderEventTypes.cancelled,
		payloadSchema: OrderCancelledPayload,
	},
	async (event, ctx) => {
		const p = event.payload;
		if (!p.organizationId) {
			// B2C — no per-org account, skip
			logger.info("budget.shadow.orderCancelled.b2cSkip", {
				eventId: event.id,
				orderId: p.orderId,
			});
			return;
		}
		await applyShadowTransaction({
			companyId: ctx.companyId,
			storeId: ctx.storeId,
			eventId: event.id,
			organizationId: p.organizationId,
			organizationName: p.organizationId,
			billingAccountId: null,
			type: "order_cancelled",
			debt: -(p.total ?? 0),              // negative — reverses original debit
			orderId: p.orderId,
			orderTotal: p.total ?? null,
			deliveryNoteId: null,
			deliveryNoteNumber: null,
			paymentReference: null,
			paymentDate: null,
			paymentMethod: null,
			note: p.reason ?? null,
			createdBy: p.cancelledBy ?? "system",
		});
	},
);
