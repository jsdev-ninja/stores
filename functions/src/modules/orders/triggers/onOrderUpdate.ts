import * as functions from "firebase-functions/v1";
import { logger } from "firebase-functions/v2";
import diff from "microdiff";
import { FirebaseAPI, TOrder } from "@jsdev_ninja/core";
import { cancelOrder } from "../services/cancelOrder";
import { refundOrder } from "../services/refundOrder";
import { completeOrder } from "../services/completeOrder";
import { trackOrderPayment } from "../services/trackOrderPayment";
import { handleOrderDocumentAttached } from "../services/handleOrderDocumentAttached";

export const onOrderUpdate = functions
	.runWith({ memory: "1GB", timeoutSeconds: 540 })
	.firestore.document(FirebaseAPI.firestore.getDocPath("orders"))
	.onUpdate(async (snap, context) => {
		const { storeId, companyId, id: orderId } = context.params;
		const before = snap.before.data() as TOrder;
		const after = snap.after.data() as TOrder;

		logger.info("onOrderUpdate: order updated", {
			orderId,
			companyId,
			storeId,
			statusBefore: before.status,
			statusAfter: after.status,
			paymentStatusBefore: before.paymentStatus,
			paymentStatusAfter: after.paymentStatus,
			diff: diff(
				before as unknown as Record<string, unknown>,
				after as unknown as Record<string, unknown>,
			),
		});

		// any → completed
		if (before.status !== "completed" && after.status === "completed") {
			await completeOrder({ order: after, orderId, companyId, storeId });
		}

		// any → cancelled
		if (before.status !== "cancelled" && after.status === "cancelled") {
			await cancelOrder({ order: after, orderId, companyId, storeId });
		}

		// any → refunded
		if (before.status !== "refunded" && after.status === "refunded") {
			await refundOrder({ order: after, orderId, companyId, storeId });
		}

		// paymentStatus → completed
		if (
			before.paymentStatus !== "completed" &&
			after.paymentStatus === "completed"
		) {
			await trackOrderPayment({ order: after, orderId, companyId, storeId });
		}

		// deliveryNote / ezDeliveryNote field added
		const deliveryNoteAttached =
			(!(before as any).deliveryNote && !!(after as any).deliveryNote) ||
			(!(before as any).ezDeliveryNote && !!(after as any).ezDeliveryNote);
		if (deliveryNoteAttached) {
			await handleOrderDocumentAttached({
				order: after,
				orderId,
				companyId,
				storeId,
				kind: "deliveryNote",
			});
		}

		// invoice / ezInvoice field added
		const invoiceAttached =
			(!(before as any).invoice && !!(after as any).invoice) ||
			(!(before as any).ezInvoice && !!(after as any).ezInvoice);
		if (invoiceAttached) {
			await handleOrderDocumentAttached({
				order: after,
				orderId,
				companyId,
				storeId,
				kind: "invoice",
			});
		}
	});
