import { TOrder } from "@jsdev_ninja/core";
import { emitEvent } from "../../../platform/eventBus";
import { DocumentEventTypes, DocumentDeliveryNoteCreatedPayload } from "../events";

export async function emitDeliveryNoteCreated(params: {
	order: TOrder;
	companyId: string;
	storeId: string;
	deliveryNoteNumber: string;
}) {
	await emitEvent<DocumentDeliveryNoteCreatedPayload>({
		type: DocumentEventTypes.deliveryNoteCreated,
		source: "documents",
		companyId: params.companyId,
		storeId: params.storeId,
		actorId: "system",
		payload: {
			orderId: params.order.id,
			deliveryNoteId: params.deliveryNoteNumber,
			deliveryNoteNumber: params.deliveryNoteNumber,
			organizationId: params.order.organizationId,
			...(params.order.client?.id ? { clientId: params.order.client.id } : {}),
			billingAccountId: params.order.billingAccount?.id ?? null,
			total: params.order.cart?.cartTotal,
			vat: params.order.cart?.cartVat,
			currency: "ILS" as const,
			createdAt: Date.now(),
			createdBy: "system",
		},
	});
}
