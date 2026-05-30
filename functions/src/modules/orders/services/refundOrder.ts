import { logger } from "firebase-functions/v2";
import { TOrder } from "@jsdev_ninja/core";
import { budgetWriter } from "../../budget/internal/writer";

/**
 * Handles the refund of an order: reverses budget impact for B2B orders.
 * Currently does NOT emit an `order.refunded` event — payload is defined in
 * events.ts for future use but no callers exist yet.
 */
export async function refundOrder(params: {
	order: TOrder;
	orderId: string;
	companyId: string;
	storeId: string;
}) {
	const { order, orderId, companyId, storeId } = params;

	logger.info("refundOrder: handling refund", {
		orderId,
		companyId,
		storeId,
		organizationId: order.organizationId,
	});

	if (order.organizationId) {
		await budgetWriter
			.onOrderCancelled(order, companyId, storeId, "order_refunded")
			.catch((err) => {
				logger.error("refundOrder: budget reversal failed", {
					orderId,
					companyId,
					storeId,
					err,
				});
			});
	}
}
