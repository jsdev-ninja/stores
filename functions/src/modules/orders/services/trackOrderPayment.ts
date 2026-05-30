import { logger } from "firebase-functions/v2";
import { TOrder } from "@jsdev_ninja/core";
import { organizationActionsService } from "../../../services/organizationActionsService";

/**
 * Handles a payment completion on an order: tracks the payment and notifies
 * organization actions for B2B orders. Called when paymentStatus transitions
 * to "completed".
 *
 * organizationActions errors are caught locally to keep the trigger going.
 */
export async function trackOrderPayment(params: {
	order: TOrder;
	orderId: string;
	companyId: string;
	storeId: string;
}) {
	const { order, orderId, companyId, storeId } = params;

	logger.info("trackOrderPayment: tracking payment completion", {
		orderId,
		companyId,
		storeId,
		organizationId: order.organizationId,
	});

	if (order.organizationId) {
		await organizationActionsService.onPaymentCompleted(order).catch((err) => {
			logger.error("trackOrderPayment: organizationActions.onPaymentCompleted failed", {
				orderId,
				companyId,
				storeId,
				err,
			});
		});
	}
}
