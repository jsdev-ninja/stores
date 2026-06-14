import { emitEvent } from "../../../platform/eventBus";
import { DocumentEventTypes, DocumentInvoiceCreatedPayload } from "../events";

export async function emitInvoiceCreated(params: {
	orderId: string;
	invoiceNumber: string;
	invoiceDocUuid: string;
	/** price_total from EZcount (shekels) — converted to agorot here */
	priceTotal: number;
	companyId: string;
	storeId: string;
	deliveryNoteNumber?: string;
	organizationId?: string;
	allocationNumber?: string;
}): Promise<void> {
	const amount = Math.round(params.priceTotal * 100); // shekels → integer agorot

	await emitEvent<DocumentInvoiceCreatedPayload>({
		type: DocumentEventTypes.invoiceCreated,
		source: "documents",
		companyId: params.companyId,
		storeId: params.storeId,
		actorId: "system",
		payload: {
			orderId: params.orderId,
			invoiceNumber: params.invoiceNumber,
			invoiceDocUuid: params.invoiceDocUuid,
			amount,
			companyId: params.companyId,
			storeId: params.storeId,
			...(params.deliveryNoteNumber ? { deliveryNoteNumber: params.deliveryNoteNumber } : {}),
			...(params.organizationId ? { organizationId: params.organizationId } : {}),
			...(params.allocationNumber ? { allocationNumber: params.allocationNumber } : {}),
		},
	});
}
