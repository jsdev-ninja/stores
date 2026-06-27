import * as functions from "firebase-functions/v1";
import { internalChargeJ5Order } from "../internal/chargeJ5Order";

// charge order for J5 transaction
export const chargeOrder = functions.https.onCall(
  async (data: { order: { id: string } }, context) => {
    try {
      // Security: derive tenant context from the auth token ONLY — never from client data.
      // The client supplies only the orderId; companyId and storeId come from the verified token.
      const tokenStoreId: string | undefined = context.auth?.token.storeId;
      const tokenCompanyId: string | undefined = context.auth?.token.companyId;

      if (!tokenStoreId || !tokenCompanyId) {
        functions.logger.error(
          "chargeOrder: missing storeId or companyId in auth token",
          {
            uid: context.auth?.uid ?? null,
          },
        );
        return { success: false, error: "unauthorized" };
      }

      const orderId = data.order?.id;
      if (!orderId || typeof orderId !== "string") {
        functions.logger.error(
          "chargeOrder: missing or invalid order.id in request",
        );
        return { success: false, error: "invalid_input" };
      }

      const storeId = tokenStoreId;
      const companyId = tokenCompanyId;

      const res = await internalChargeJ5Order({
        orderId,
        companyId,
        storeId,
        contextUid: context.auth?.uid ?? null,
        actorId: context.auth?.uid,
      });

      if (res.success) {
        return { success: true };
      }
      return null;
    } catch (error: any) {
      functions.logger.error("chargeOrder: failed", { message: error.message });
      return null;
    }
  },
);
