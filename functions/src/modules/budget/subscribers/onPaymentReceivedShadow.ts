import { subscribe } from "../../../platform/eventBus";
import { PaymentEventTypes, PaymentReceivedPayload } from "../../payments";
import { applyShadowTransaction } from "../internal/shadowWrite";

export const onPaymentReceivedShadow = subscribe(
	{
		name: "budget-shadow-on-payment-received",
		type: PaymentEventTypes.received,
		payloadSchema: PaymentReceivedPayload,
	},
	async (event, ctx) => {
		const p = event.payload;
		if (!p.organizationId) {
			return;
		}
		await applyShadowTransaction({
			companyId: ctx.companyId,
			storeId: ctx.storeId,
			eventId: event.id,
			organizationId: p.organizationId,
			organizationName: p.organizationId,
			billingAccountId: null,
			type: "payment_received",
			debt: -(p.amount ?? 0),             // negative — reduces debt
			orderId: p.orderId ?? null,
			orderTotal: null,
			deliveryNoteId: null,
			deliveryNoteNumber: null,
			paymentReference: p.providerReference ?? null,
			paymentDate: p.paymentDate ?? null,
			paymentMethod: p.paymentMethod ?? null,
			note: null,
			createdBy: p.receivedBy ?? "system",
		});
	},
);
