import admin from "firebase-admin";
import * as functions from "firebase-functions/v1";
import * as functionsV2 from "firebase-functions/v2";
import React from "react";
import algoliasearch from "algoliasearch";
import { emailService } from "./services/email";
import { render } from "@react-email/render";
import OrderCreated from "./emails/OrderCreated";
import { FirebaseAPI, TOrder, TStore } from "@jsdev_ninja/core";
import { ezCountService } from "./services/ezCountService";
import { createAppApi } from "./appApi";
import { budgetService } from "./services/budgetService";
import { organizationActionsService } from "./services/organizationActionsService";
import { emit } from "./platform/eventBus";

async function emitOrderPlaced(params: {
	order: TOrder;
	orderId: string;
	companyId: string;
	storeId: string;
}) {
	try {
		await admin.firestore().runTransaction(async (tx) => {
			emit(tx, {
				type: "order.placed",
				source: "orders",
				companyId: params.companyId,
				storeId: params.storeId,
				actorId: params.order.userId ? `user:${params.order.userId}` : "system",
				payload: {
					orderId: params.orderId,
					total: params.order.cart?.cartTotal ?? 0,
					status: params.order.status,
					paymentType: params.order.paymentType,
					organizationId: params.order.organizationId,
					customerEmail: params.order.client?.email,
					billingAccount: params.order.billingAccount?? null
				},
			});
		});
	} catch (err) {
		functionsV2.logger.error("eventBus.emit.order_placed.failed", {
			orderId: params.orderId,
			companyId: params.companyId,
			storeId: params.storeId,
			err,
		});
	}
}

const algolia = algoliasearch("633V4WVLUB", "2f3dbcf0c588a92a1e553020254ddb3a");

const index = algolia.initIndex("products");

admin.initializeApp({
	storageBucket: "jsdev-stores-prod.appspot.com",
});

admin.firestore().settings({ ignoreUndefinedProperties: true });

export const uiLogs = functionsV2.https.onCall((opts) => {
	const { data } = opts;
	functionsV2.logger.write(data);
});

export { chatbotApi } from "./api/chatbotApi";
export { appInit } from "./api/init";
export { getMixpanelData } from "./api/mixpanel-ts";
export { createCompanyClient } from "./api/createCompany";
export { createPayment } from "./api/createPayment";
export { chargeOrder } from "./api/chargeOrder";
export { createInvoice } from "./api/createInvoice";
export { createDeliveryNote } from "./api/createDeliveryNote";
export { onSupplierInvoiceCreate } from "./events/supplier-invoice-events";
export { onContactFormSubmit } from "./events/contact-form-events";
export { onLandingLeadCreated } from "./events/landing-lead-events";
export {
	getBudgetAccount,
	listBudgetAccounts,
	getBudgetTransactions,
	markOrderPaid,
	addBudgetManualTransaction,
} from "./api/budgetApi";
export { getOrganizationActions } from "./api/organizationActionsApi";
export { migrateProfilesToMultiOrg } from "./api/migrateProfiles";

export const onOrderCreated = functions.firestore
	.document(FirebaseAPI.firestore.getDocPath("orders"))
	.onCreate(async (snap, context) => {
		const { storeId, companyId, id } = context.params;

		const appApi = createAppApi({ storeId, companyId });

		const order = snap.data() as TOrder;

		functionsV2.logger.write({
			severity: "INFO",
			message: `new order created, orderId:${id} ${storeId} ${companyId}`,
			orderId: id,
			storeId,
			companyId,
			order,
		});

		const storePrivateData: any = (
			await admin.firestore().collection(`STORES/${storeId}/private`).doc("data").get()
		).data();

		const store: TStore = (
			await admin.firestore().collection(`STORES`).doc(storeId).get()
		).data() as TStore;

		if (!storePrivateData) {
			console.log("storePrivateData not exits");
		}

		// Emit order.placed event for real orders (not drafts awaiting j5 payment).
		if (order.status !== "draft") {
			await emitOrderPlaced({ order, orderId: id, companyId, storeId });
		}

		// close cart
		await appApi.cart.close(order.cart.id);

		// send email
		const html = await render(<OrderCreated order={order} />);

		await emailService.sendEmail({
			html,
			email: storePrivateData?.storeEmail ?? "",
		});

		// budget: debt is now added on delivery note creation, not order creation
		// organizationActions: order.created events no longer written for new orders
	});
export const onOrderUpdate = functions
	.runWith({
		memory: "1GB",
		timeoutSeconds: 540,
	})
	.firestore.document(FirebaseAPI.firestore.getDocPath("orders"))
	.onUpdate(async (snap, context) => {
		const { storeId, companyId, id } = context.params;
		const after = snap.after.data() as TOrder;
		const before = snap.before.data() as TOrder;

		const appApi = createAppApi({ storeId, companyId });

		console.log("order update", {
			before,
			after,
			id,
			storeId,
			companyId,
		});

		const { displayName, email } = after.client ?? {};

		// Emit order.placed the first time the order leaves draft status.
		const leftDraft = before.status === "draft" && after.status !== "draft";
		if (leftDraft) {
			await emitOrderPlaced({ order: after, orderId: id, companyId, storeId });
		}

		const orderCompleted = before.status !== "completed" && after.status === "completed";

		console.log("order status", {
			orderCompleted,
		});

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
			// track payment completed
			await appApi.payments.trackPaymentCompleted(after);
			if (after.organizationId) {
				await organizationActionsService.onPaymentCompleted(after).catch((err) => {
					functionsV2.logger.write({ severity: "ERROR", message: "organizationActions.onPaymentCompleted failed", err });
				});
			}
		}

		const deliveryNoteCreated =
			!(before as any).deliveryNote && !!(after as any).deliveryNote ||
			!(before as any).ezDeliveryNote && !!(after as any).ezDeliveryNote;
		if (deliveryNoteCreated && after.organizationId) {
			await organizationActionsService.onDeliveryNoteCreated(after).catch((err) => {
				functionsV2.logger.write({ severity: "ERROR", message: "organizationActions.onDeliveryNoteCreated failed", err });
			});
		}

		const invoiceCreated =
			!(before as any).invoice && !!(after as any).invoice ||
			!(before as any).ezInvoice && !!(after as any).ezInvoice;
		if (invoiceCreated && after.organizationId) {
			await organizationActionsService.onInvoiceCreated(after).catch((err) => {
				functionsV2.logger.write({ severity: "ERROR", message: "organizationActions.onInvoiceCreated failed", err });
			});
		}

		// budget: reverse debit when order is cancelled or refunded (non-blocking)
		if (after.organizationId) {
			const wasCancelled = before.status !== "cancelled" && after.status === "cancelled";
			const wasRefunded = before.status !== "refunded" && after.status === "refunded";
			if (wasCancelled || wasRefunded) {
				const type = wasCancelled ? "order_cancelled" : "order_refunded";
				budgetService.onOrderCancelled(after, companyId, storeId, type).catch((err) => {
					functionsV2.logger.write({ severity: "ERROR", message: "budget.onOrderCancelled failed", err });
				});
			}
		}

		return;
	});

export const onProductCreate = functions.firestore
	.document(FirebaseAPI.firestore.getDocPath("products"))
	.onCreate(async (snap, context) => {
		console.log(snap.data(), snap.id, snap.createTime);
		console.log("AUTH", context.authType, context.auth?.uid);

		return await index.saveObject({
			...snap.data(),
			id: snap.id,
			objectID: snap.id,
		});
	});

export const onProductDelete = functions.firestore
	.document(FirebaseAPI.firestore.getDocPath("products"))
	.onDelete(async (snap) => {
		return await index.deleteObject(snap.id);
	});

export const onProductUpdate = functions.firestore
	.document(FirebaseAPI.firestore.getDocPath("products"))
	.onUpdate(async (snap, context) => {
		const after = snap.after.data();

		const { id: productId } = context.params;

		return await index.saveObject({
			objectID: productId,
			id: productId,
			...after,
		});
	});

export const onUserDelete = functions.auth.user().onDelete((user) => {
	console.info("user deleted", user.uid, user.displayName, user.email);
	const uid = user.uid; // The UID of the user.

	const db = admin.firestore();
	return db
		.collection("profiles")
		.doc(uid)
		.delete()
		.then(() => {
			console.log("User document deleted in Firestore");
		})
		.catch((error) => {
			console.error("Error deleting user document in Firestore", error);
		});
});
