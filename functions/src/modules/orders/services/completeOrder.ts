import { logger } from "firebase-functions/v2";
import { TOrder } from "@jsdev_ninja/core";
import { createAppApi } from "../../../appApi";

/**
 * Handles the completion of an order: creates a delivery note for external
 * (cash-on-delivery) orders. HYP-paid orders are handled by the HYP integration
 * directly and skip delivery-note creation here.
 *
 * Errors from createDeliveryNote are caught by appApi and logged at the source.
 */
export async function completeOrder(params: {
	order: TOrder;
	orderId: string;
	companyId: string;
	storeId: string;
}) {
	const { order, orderId, companyId, storeId } = params;
	const appApi = createAppApi({ storeId, companyId });

	if (order.paymentType === "external") {
		logger.info("completeOrder: createDeliveryNote", {
			orderId,
			companyId,
			storeId,
			email: order.client?.email,
			displayName: order.client?.displayName,
		});
		await appApi.documents.createDeliveryNote(order);
	} else {
		logger.info(
			"completeOrder: skip createDeliveryNote - paymentType is not external, HYP handles it",
			{
				orderId,
				companyId,
				storeId,
				paymentType: order.paymentType,
			},
		);
	}
}
