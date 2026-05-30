import admin from "firebase-admin";
import { TOrder, TPaymentMethod } from "@jsdev_ninja/core";
import { emitEvent } from "../../../platform/eventBus";
import { PaymentEventTypes, PaymentReceivedPayload } from "../events";

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
	const paymentId = admin.firestore().collection("_ids").doc().id;

	await emitEvent<PaymentReceivedPayload>({
		type: PaymentEventTypes.received,
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
}
