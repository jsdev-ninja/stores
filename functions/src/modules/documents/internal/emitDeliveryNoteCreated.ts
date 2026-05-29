import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { TOrder } from "@jsdev_ninja/core";
import { emit } from "../../../platform/eventBus";

export async function emitDeliveryNoteCreated(params: {
	order: TOrder;
	companyId: string;
	storeId: string;
	deliveryNoteNumber: string;
}) {
	try {
		await admin.firestore().runTransaction(async (tx) => {
			emit(tx, {
				type: "documents.delivery_note_created",
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
		});
	} catch (err) {
		logger.error("eventBus.emit.fulfillment_delivery_note_created.failed", {
			orderId: params.order.id,
			companyId: params.companyId,
			storeId: params.storeId,
			err,
		});
	}
}
