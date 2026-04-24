import { logger } from "firebase-functions/v2";
import { TOrder } from "@jsdev_ninja/core";
import { createAppApi } from "../../../appApi";
import { budgetService } from "../../../services/budgetService";
import { organizationActionsService } from "../../../services/organizationActionsService";
import { emitOrderPlaced } from "./emitPlaced";

export async function handleOrderCreated(params: {
	order: TOrder;
	orderId: string;
	companyId: string;
	storeId: string;
}) {
	const { order, orderId, companyId, storeId } = params;
	const appApi = createAppApi({ storeId, companyId });

	logger.write({
		severity: "INFO",
		message: `new order created, orderId:${orderId} ${storeId} ${companyId}`,
		orderId,
		storeId,
		companyId,
		order,
	});

	if (order.status !== "draft") {
		await emitOrderPlaced({ order, orderId, companyId, storeId });
	}

	// close cart
	await appApi.cart.close(order.cart.id);

	// admin email moved to modules/notifications/subscribers/orderPlacedAdminEmail
	// budget: debt is now added on delivery note creation, not order creation
	// organizationActions: order.created events no longer written for new orders
}

export async function handleOrderUpdated(params: {
	before: TOrder;
	after: TOrder;
	orderId: string;
	companyId: string;
	storeId: string;
}) {
	const { before, after, orderId, companyId, storeId } = params;
	const appApi = createAppApi({ storeId, companyId });

	console.log("order update", { before, after, id: orderId, storeId, companyId });

	const { displayName, email } = after.client ?? {};

	// Emit order.placed the first time the order leaves draft status.
	const leftDraft = before.status === "draft" && after.status !== "draft";
	if (leftDraft) {
		await emitOrderPlaced({ order: after, orderId, companyId, storeId });
	}

	const orderCompleted = before.status !== "completed" && after.status === "completed";

	console.log("order status", { orderCompleted });

	if (orderCompleted) {
		if (after.paymentType === "external") {
			console.log("createDeliveryNote", email, displayName);
			await appApi.documents.createDeliveryNote(after);
		} else {
			console.log("skip createDeliveryNote - paymentType is not external, HYP handles it", after.paymentType);
		}
	}

	const paymentCompleted = before.paymentStatus !== "completed" && after.paymentStatus === "completed";

	if (paymentCompleted) {
		await appApi.payments.trackPaymentCompleted(after);
		if (after.organizationId) {
			await organizationActionsService.onPaymentCompleted(after).catch((err) => {
				logger.write({ severity: "ERROR", message: "organizationActions.onPaymentCompleted failed", err });
			});
		}
	}

	const deliveryNoteCreated =
		(!(before as any).deliveryNote && !!(after as any).deliveryNote) ||
		(!(before as any).ezDeliveryNote && !!(after as any).ezDeliveryNote);
	if (deliveryNoteCreated && after.organizationId) {
		await organizationActionsService.onDeliveryNoteCreated(after).catch((err) => {
			logger.write({ severity: "ERROR", message: "organizationActions.onDeliveryNoteCreated failed", err });
		});
	}

	const invoiceCreated =
		(!(before as any).invoice && !!(after as any).invoice) ||
		(!(before as any).ezInvoice && !!(after as any).ezInvoice);
	if (invoiceCreated && after.organizationId) {
		await organizationActionsService.onInvoiceCreated(after).catch((err) => {
			logger.write({ severity: "ERROR", message: "organizationActions.onInvoiceCreated failed", err });
		});
	}

	if (after.organizationId) {
		const wasCancelled = before.status !== "cancelled" && after.status === "cancelled";
		const wasRefunded = before.status !== "refunded" && after.status === "refunded";
		if (wasCancelled || wasRefunded) {
			const type = wasCancelled ? "order_cancelled" : "order_refunded";
			budgetService.onOrderCancelled(after, companyId, storeId, type).catch((err) => {
				logger.write({ severity: "ERROR", message: "budget.onOrderCancelled failed", err });
			});
		}
	}
}
