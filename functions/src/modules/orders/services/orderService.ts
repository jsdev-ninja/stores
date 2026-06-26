import { logger } from "firebase-functions/v2";
import { emitEvent } from "../../../platform/eventBus";
import { createAppApi } from "../../../appApi";
import { OrderEventTypes, OrderCancelledPayload } from "../events";
import { CancelOrderParams, CompleteOrderParams } from "../types";

export const orderService = {
  async cancel(params: CancelOrderParams): Promise<void> {
    const { order, orderId, companyId, storeId, reason, cancelledByUserId } =
      params;

    logger.info("cancelOrder: handling cancellation", {
      orderId,
      companyId,
      storeId,
      organizationId: order.organizationId,
    });

    await emitEvent<OrderCancelledPayload>({
      type: OrderEventTypes.cancelled,
      source: "orders",
      companyId,
      storeId,
      actorId: cancelledByUserId ? `user:${cancelledByUserId}` : "system",
      payload: {
        orderId: order.id,
        organizationId: order.organizationId,
        ...(order.client?.id ? { clientId: order.client.id } : {}),
        total: order.cart?.cartTotal,
        reason,
        cancelledAt: Date.now(),
        cancelledBy: cancelledByUserId ?? "system",
      },
    });
  },

  async complete(params: CompleteOrderParams): Promise<void> {
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
  },
};
