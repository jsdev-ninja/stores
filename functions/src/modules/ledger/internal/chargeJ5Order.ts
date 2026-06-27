import { TOrder, FirebaseAPI } from "@jsdev_ninja/core";
import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { TPayProtocolResponse, TStorePrivate } from "src/schema";
import { hypPaymentService } from "../../../services/hypPaymentService";
import { postTransaction } from "../services/postTransaction";
import { buildFulfilledHeshDescItems } from "./fulfilledHeshDescItems";

function sumHeshDescItems(items: string[]): number {
  const itemsSum = items.reduce((sum, line) => {
    const m = line.match(/~([\d.]+)~([\d.]+)\]$/);
    if (!m) return sum;
    return sum + Number((parseFloat(m[1]) * parseFloat(m[2])).toFixed(2));
  }, 0);
  return Number(itemsSum.toFixed(2));
}

export async function internalChargeJ5Order(params: {
  orderId: string;
  companyId: string;
  storeId: string;
  contextUid: string | null;
  actorId?: string; // e.g. "system" or user id
}) {
  const { orderId, companyId, storeId, contextUid, actorId } = params;

  const storePrivateData: TStorePrivate = (
    await admin
      .firestore()
      .collection(`STORES/${storeId}/private`)
      .doc("data")
      .get()
  ).data() as TStorePrivate;

  // Load the order under the tenant path
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
    logger.error("internalChargeJ5Order: order not found under token tenant", {
      orderId,
      companyId,
      storeId,
      uid: contextUid,
    });
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
    logger.error("internalChargeJ5Order: payment doc not found", {
      orderId,
      companyId,
      storeId,
      uid: contextUid,
    });
    return { success: false, error: "payment_not_found" };
  }

  const payment = paymentDoc.data() as { payment: TPayProtocolResponse };
  const transactionId = payment.payment?.Id;

  if (!transactionId) {
    logger.error("internalChargeJ5Order: transactionId missing in payment doc", {
      orderId,
      companyId,
      storeId,
    });
    return { success: false, error: "missing_transaction_id" };
  }

  const items = buildFulfilledHeshDescItems(order);

  // Amount sent to HYP must equal HYP's own sum of the heshDesc lines.
  const adjustedAmount = sumHeshDescItems(items);

  logger.info("internalChargeJ5Order: amounts", {
    orderId: order.id,
    cartTotal: order.cart.cartTotal,
    chargedAmount: adjustedAmount,
  });

  const [clientName, clientLastName] = (payment.payment.Fild1 ?? "").split(" ");
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
      companyId,
      storeId,
    }).catch((err) => {
      logger.error("internalChargeJ5Order: postTransaction failed (non-fatal)", {
        orderId: order.id,
        hypTransactionId: payment.payment.Id,
        err: err?.message,
      });
    });

    await admin
      .firestore()
      .collection(
        FirebaseAPI.firestore.getPath({
          collectionName: "payments",
          companyId,
          storeId,
        }),
      )
      .doc(orderId + "_charged")
      .set(res.data, { merge: true });
  } else {
    logger.error("internalChargeJ5Order: charge failed", { 
        orderId: order.id, 
        errMessage: res.errMessage,
        data: res.data 
    });
  }
  
  return { success: res.success, errMessage: res.errMessage, data: res.data };
}
