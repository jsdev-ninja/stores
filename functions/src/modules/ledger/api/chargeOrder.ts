import { TOrder, FirebaseAPI } from "@jsdev_ninja/core";
import * as functions from "firebase-functions/v1";
import admin from "firebase-admin";
import { TPayProtocolResponse, TStorePrivate } from "src/schema";
import { hypPaymentService } from "../../../services/hypPaymentService";
import { postTransaction } from "../services/postTransaction";
import { buildFulfilledHeshDescItems } from "../internal/fulfilledHeshDescItems";

function sumHeshDescItems(items: string[]): number {
  const itemsSum = items.reduce((sum, line) => {
    const m = line.match(/~([\d.]+)~([\d.]+)\]$/);
    if (!m) return sum;
    return sum + Number((parseFloat(m[1]) * parseFloat(m[2])).toFixed(2));
  }, 0);
  return Number(itemsSum.toFixed(2));
}

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

      const storePrivateData: TStorePrivate = (
        await admin
          .firestore()
          .collection(`STORES/${storeId}/private`)
          .doc("data")
          .get()
      ).data() as TStorePrivate;

      // Load the order under the TOKEN's tenant path — if it's not there, the caller
      // has no business accessing it (cross-tenant attempt or invalid id).
      const orderDoc = await admin
        .firestore()
        .collection(
          FirebaseAPI.firestore.getPath({
            collectionName: "orders",
            companyId,
            storeId,
          }),
        )
        .doc(orderId)
        .get();

      if (!orderDoc.exists) {
        functions.logger.error(
          "chargeOrder: order not found under token tenant",
          {
            orderId,
            companyId,
            storeId,
            uid: context.auth?.uid ?? null,
          },
        );
        return { success: false, error: "order_not_found" };
      }

      const order = orderDoc.data() as TOrder;

      const paymentDoc = await admin
        .firestore()
        .collection(
          FirebaseAPI.firestore.getPath({
            collectionName: "payments",
            companyId,
            storeId,
          }),
        )
        .doc(orderId)
        .get();

      if (!paymentDoc.exists) {
        // todo return err
        return;
      }

      const payment = paymentDoc.data() as { payment: TPayProtocolResponse };

      const transactionId = payment.payment?.Id;

      if (!transactionId) {
        // todo
      }

      const items = buildFulfilledHeshDescItems(order);

      // Amount sent to HYP must equal HYP's own sum of the heshDesc lines.
      const adjustedAmount = sumHeshDescItems(items);

      functions.logger.info("chargeOrder: amounts", {
        orderId: order.id,
        cartTotal: order.cart.cartTotal,
        chargedAmount: adjustedAmount,
      });

      const [clientName, clientLastName] = (payment.payment.Fild1 ?? "").split(
        " ",
      );
      const res = await hypPaymentService.chargeJ5Transaction({
        actualAmount: adjustedAmount as any,
        originalAmount: Number(payment.payment.Amount).toFixed(2) as any,
        creditCardConfirmNumber: payment.payment.ACode,
        masof: storePrivateData.hypData.masof,
        masofPassword: storePrivateData.hypData.password,
        orderId: order.id,
        transactionId: payment.payment.Id,
        transactionUID: payment.payment.UID ?? "",
        clientName: order?.nameOnInvoice || clientName,
        clientLastName,
        email: order.client?.email ?? "",
        heshDesc: items.join(""),
        Pritim: "True",
      });

      if (res.success) {
        // B6: Post a hyp_capture transaction to the ledger.
        // The onTransactionPostedMarkOrderPaid subscriber will set order.paymentStatus = "completed".
        // We do NOT directly write paymentStatus here to avoid a race condition.
        // HYP adjustedAmount is in shekels — convert to integer agorot for ledger.
        const amountAgorot = Math.round(adjustedAmount * 100);

        await postTransaction({
          source: "hyp_result",
          hypTransactionId: payment.payment.Id, // dedup key: hyp_{Id}
          type: "hyp_capture",
          amount: amountAgorot,
          currency: "ILS",
          direction: "in",
          reference: { type: "order", id: order.id },
          payer: {
            organizationId: order.organizationId,
            clientId: order.client?.id,
            billingAccountId: order.billingAccount?.id,
          },
          clientName: order?.nameOnInvoice || clientName,
          email: order.client?.email,
          hyp: {
            masof: storePrivateData.hypData.masof,
            rawResponse: (res.data as Record<string, unknown>) ?? {},
            capturedFromTransactionId: payment.payment.Id,
          },
          // Use the token-derived tenant (companyId/storeId), not order fields.
          companyId,
          storeId,
        }).catch((err) => {
          // Log but don't fail the charge — the HYP transaction already succeeded.
          // The ledger record is best-effort on this legacy path; captureHypJ5 is preferred.
          functions.logger.error(
            "chargeOrder: postTransaction failed (non-fatal)",
            {
              orderId: order.id,
              hypTransactionId: payment.payment.Id,
              err: err?.message,
            },
          );
        });

        await admin
          .firestore()
          .collection(
            FirebaseAPI.firestore.getPath({
              collectionName: "payments",
              // Use the token-derived tenant (companyId/storeId), not order fields.
              companyId,
              storeId,
            }),
          )
          .doc(orderId + "_charged")
          .set(res.data, { merge: true });
      }
      return { success: true };
    } catch (error: any) {
      functions.logger.error("chargeOrder: failed", { message: error.message });
      return null;
    }
  },
);
