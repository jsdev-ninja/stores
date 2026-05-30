import { logger } from "firebase-functions/v2";
import { TOrder } from "@jsdev_ninja/core";
import { organizationActionsService } from "../../../services/organizationActionsService";

type OrderDocumentKind = "deliveryNote" | "invoice";

/**
 * Handles a document (delivery note or invoice) being attached to an order.
 * Notifies organization actions for B2B orders. Called from onOrderUpdate when
 * the corresponding field (deliveryNote/ezDeliveryNote/invoice/ezInvoice)
 * appears for the first time.
 *
 * No-op for non-organization orders.
 */
export async function handleOrderDocumentAttached(params: {
	order: TOrder;
	orderId: string;
	companyId: string;
	storeId: string;
	kind: OrderDocumentKind;
}) {
	const { order, orderId, companyId, storeId, kind } = params;

	if (!order.organizationId) return;

	logger.info("handleOrderDocumentAttached: notifying organization", {
		orderId,
		companyId,
		storeId,
		organizationId: order.organizationId,
		kind,
	});

	const action =
		kind === "deliveryNote"
			? organizationActionsService.onDeliveryNoteCreated(order)
			: organizationActionsService.onInvoiceCreated(order);

	await action.catch((err) => {
		logger.error("handleOrderDocumentAttached: organizationActions failed", {
			orderId,
			companyId,
			storeId,
			kind,
			err,
		});
	});
}
