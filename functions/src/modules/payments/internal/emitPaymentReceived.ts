import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { TOrder, TPaymentMethod } from "@jsdev_ninja/core";
import { emit } from "../../../platform/eventBus";

export async function emitPaymentReceived(params: {
	order: TOrder;
	organizationId: string;
	debt: number;
	paymentMethod: TPaymentMethod;
	paymentReference: string | null;
	paymentDate: number;
	paidByUserId: string;
	companyId: string;
	storeId: string;
}) {
	try {
		const paymentId = admin.firestore().collection("_ids").doc().id;

		await admin.firestore().runTransaction(async (tx) => {
			emit(tx, {
				type: "payment.received",
				source: "payments",
				companyId: params.companyId,
				storeId: params.storeId,
				actorId: params.paidByUserId ? `user:${params.paidByUserId}` : "system",
				payload: {
					paymentId,
					orderId: params.order.id,
					organizationId: params.organizationId,
					...(params.order.client?.id ? { clientId: params.order.client.id } : {}),
					amount: params.debt,
					currency: "ILS" as const,
					paymentMethod: params.paymentMethod,
					provider: "manual" as const,
					providerReference: params.paymentReference ?? undefined,
					paymentDate: params.paymentDate,
					receivedBy: params.paidByUserId ?? "system",
				},
			});
		});
	} catch (err) {
		logger.error("eventBus.emit.payment_received.failed", {
			orderId: params.order.id,
			companyId: params.companyId,
			storeId: params.storeId,
			err,
		});
	}
}
