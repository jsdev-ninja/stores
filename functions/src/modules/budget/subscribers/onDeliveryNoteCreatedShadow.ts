import { logger } from "firebase-functions/v2";
import { subscribe } from "../../../platform/eventBus";
import { DocumentEventTypes, DocumentDeliveryNoteCreatedPayload } from "../../documents";
import { applyShadowTransaction } from "../internal/shadowWrite";

export const onDeliveryNoteCreatedShadow = subscribe(
	{
		name: "budget-shadow-on-delivery-note-created",
		type: DocumentEventTypes.deliveryNoteCreated,
		payloadSchema: DocumentDeliveryNoteCreatedPayload,
	},
	async (event, ctx) => {
		const p = event.payload;
		if (!p.organizationId) {
			// B2C — no per-org account, skip
			logger.info("budget.shadow.deliveryNote.b2cSkip", {
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
			organizationName: p.organizationId, // name not in payload; id used as placeholder
			billingAccountId: p.billingAccountId ?? null,
			type: "delivery_note",
			debt: p.total ?? 0,                 // positive — adds to debt
			orderId: p.orderId,
			orderTotal: p.total ?? null,
			deliveryNoteId: p.deliveryNoteId ?? null,
			deliveryNoteNumber: p.deliveryNoteNumber ?? null,
			paymentReference: null,
			paymentDate: null,
			paymentMethod: null,
			note: null,
			createdBy: p.createdBy ?? "system",
		});
	},
);
