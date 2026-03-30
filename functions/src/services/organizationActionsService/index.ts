import admin from "firebase-admin";
import { TBillingAccount, TOrder } from "@jsdev_ninja/core";
import { logger } from "firebase-functions/v2";

export type TOrganizationActionType =
	| "order.created"
	| "delivery_note.created"
	| "invoice.created"
	| "payment.completed";

export type TOrganizationAction = {
	id: string;
	type: TOrganizationActionType;
	orderId: string;
	orderTotal: number;
	billingAccountId: string | null;
	billingAccountName: string | null;
	billingAccountNumber: string | null;
	date: number;
	createdAt: number;
	meta: Record<string, any>;
};

function actionsPath(organizationId: string) {
	return `organizations/${organizationId}/actions`;
}

async function writeAction(
	organizationId: string,
	action: Omit<TOrganizationAction, "id">,
): Promise<void> {
	const db = admin.firestore();
	const ref = db.collection(actionsPath(organizationId)).doc();
	await ref.set({ ...action, id: ref.id });
}

function billingFields(order: TOrder) {
	const ba = order.billingAccount as TBillingAccount | undefined;
	return {
		billingAccountId: ba?.id ?? null,
		billingAccountName: ba?.name ?? null,
		billingAccountNumber: ba?.number ?? null,
	};
}

export const organizationActionsService = {
	async onOrderCreated(order: TOrder): Promise<void> {
		if (!order.organizationId) return;
		await writeAction(order.organizationId, {
			type: "order.created",
			orderId: order.id,
			orderTotal: order.cart.cartTotal,
			...billingFields(order),
			date: order.date ?? Date.now(),
			createdAt: Date.now(),
			meta: { status: order.status },
		});
		logger.info("organizationActions.onOrderCreated", { orderId: order.id });
	},

	async onDeliveryNoteCreated(order: TOrder): Promise<void> {
		if (!order.organizationId) return;
		const dn = (order as any).deliveryNote ?? (order as any).ezDeliveryNote;
		await writeAction(order.organizationId, {
			type: "delivery_note.created",
			orderId: order.id,
			orderTotal: order.cart.cartTotal,
			...billingFields(order),
			date: dn?.date ?? Date.now(),
			createdAt: Date.now(),
			meta: { number: dn?.number ?? null, link: dn?.link ?? null },
		});
		logger.info("organizationActions.onDeliveryNoteCreated", { orderId: order.id });
	},

	async onInvoiceCreated(order: TOrder): Promise<void> {
		if (!order.organizationId) return;
		const inv = (order as any).invoice ?? (order as any).ezInvoice;
		await writeAction(order.organizationId, {
			type: "invoice.created",
			orderId: order.id,
			orderTotal: order.cart.cartTotal,
			...billingFields(order),
			date: inv?.date ?? Date.now(),
			createdAt: Date.now(),
			meta: { number: inv?.number ?? null, link: inv?.link ?? null },
		});
		logger.info("organizationActions.onInvoiceCreated", { orderId: order.id });
	},

	async onPaymentCompleted(order: TOrder): Promise<void> {
		if (!order.organizationId) return;
		await writeAction(order.organizationId, {
			type: "payment.completed",
			orderId: order.id,
			orderTotal: order.cart.cartTotal,
			...billingFields(order),
			date: Date.now(),
			createdAt: Date.now(),
			meta: { paymentStatus: order.paymentStatus },
		});
		logger.info("organizationActions.onPaymentCompleted", { orderId: order.id });
	},
};
