import * as functions from "firebase-functions/v1";
import { logger } from "firebase-functions/v2";
import diff from "microdiff";
import { FirebaseAPI, TOrder } from "@jsdev_ninja/core";
import { cancelOrder } from "../services/cancelOrder";
import { refundOrder } from "../services/refundOrder";
import { completeOrder } from "../services/completeOrder";

export const onOrderUpdate = functions
	.runWith({ memory: "1GB", timeoutSeconds: 540 })
	.firestore.document(FirebaseAPI.firestore.getDocPath("orders"))
	.onUpdate(async (snap, context) => {
		const { storeId, companyId, id: orderId } = context.params;
		const before = snap.before.data() as TOrder;
		const after = snap.after.data() as TOrder;

		logger.info("onOrderUpdate: order updated", {
			category: "audit.orderUpdate",
			orderId,
			companyId,
			storeId,
			// Who/when made the change (stamped by admin writes). "system" when a
			// trigger/server flow wrote it without an admin actor.
			updatedBy: after.updatedBy ?? "system",
			updatedAt: after.updatedAt ?? null,
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
	});
