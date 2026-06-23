import * as functionsV2 from "firebase-functions/v2";
import { createHash } from "crypto";
import { ezCountService } from "../../../services/ezCountService";
import { TStorePrivate } from "src/schema";
import admin from "firebase-admin";
import { FirebaseAPI, TOrder, TOrganization } from "@jsdev_ninja/core";
import { emitEvent } from "../../../platform/eventBus";
import { DocumentEventTypes, DocumentInvoiceCreatedPayload } from "../events";

// Israel ITA threshold for חשבונית ישראל (allocation number) mandate.
// TODO: externalize to config.ts when a config getter is available.
const ALLOCATION_THRESHOLD_ILS = 5000;

type TData = {
	params: Parameters<typeof ezCountService.createInvoice>[0] & {
		/** חשבונית ישראל allocation number — required when price_total >= 25,000 ILS and parent is set */
		allocationNumber?: string;
	};
	storeId: string;
	orders: TOrder[];
};

// create invoice in HYP
export const createInvoice = functionsV2.https.onCall<TData, void>(
	{
		memory: "1GiB",
		timeoutSeconds: 540,
	},
	async (request) => {
		const { data, auth } = request;
		const { params, storeId, orders } = data;

		functionsV2.logger.write({
			severity: "INFO",
			message: "createInvoice",
			params,
			storeId,
			orders,
		});

		// Compliance gate: when creating an invoice from a delivery note (params.parent
		// set) and the total meets or exceeds the חשבונית ישראל threshold, an
		// allocation number is mandatory. Reject before touching EZcount.
		if (
			params.parent &&
			(params.price_total ?? 0) >= ALLOCATION_THRESHOLD_ILS &&
			!params.allocationNumber
		) {
			functionsV2.logger.warn("createInvoice: allocation_required — invoice total >= ILS threshold but no allocationNumber supplied", {
				price_total: params.price_total,
				threshold: ALLOCATION_THRESHOLD_ILS,
				storeId,
				orderId: orders[0]?.id,
			});
			return { success: false, error: "allocation_required" };
		}

		const storePrivateData: TStorePrivate = (
			await admin.firestore().collection(`STORES/${storeId}/private`).doc("data").get()
		).data() as TStorePrivate;

		const price_total = params.price_total ?? 0;
		let organization: TOrganization | undefined;
		if (price_total > 5000 && orders[0]?.organizationId) {
			const organizationSnapshot = await admin
				.firestore()
				.collection(
					FirebaseAPI.firestore.getPath({
						collectionName: "organizations",
						companyId: auth?.token.companyId,
						storeId: auth?.token.storeId ?? "",
					})
				)
				.doc(orders[0].organizationId)
				.get();
			organization = organizationSnapshot.data() as TOrganization;
		}

		const orderIds = orders.map((o) => o.id).sort().join("|");
		// Deterministic id keyed on order ids — makes EZcount idempotent across retries.
		// EZcount caps transaction_id at 45 chars; "invoice:" is 8, so truncate the
		// sha256 hex to 36 (total 44). 144 bits stays collision-free for this purpose.
		const transactionId =
			"invoice:" + createHash("sha256").update(orderIds).digest("hex").slice(0, 36);

		const res = await ezCountService.createInvoice({
			api_key: storePrivateData.ezcount_key,
			url: storePrivateData.ezcount_api,
			transaction_id: transactionId,
			customer_name: params.customer_name,
			customer_email: params.customer_email,
			customer_address: params.customer_address,
			customer_phone: params.customer_phone,
			customer_crn: organization?.companyNumber,
			description: params.description,
			item: params.item,
			price_total: params.price_total,
			parent: params.parent,
			payment: [
				{
					payment_type: 9,
					payment_sum: params.price_total ?? 0,
					other_payment_type_name: "אחר",
				},
			],
			cc_emails: params.cc_emails,
			date: params.date,
		});

		if (!res.error && res.data) {
			// Narrow: inside this branch res.data is a TSuccess (not null).
			const ezData = res.data;

			// Build the invoice object to persist. When allocationNumber is provided,
			// embed it alongside the EZcount response so it's stored on the order doc.
			const invoiceToPersist = params.allocationNumber
				? {
						...ezData,
						allocationNumber: params.allocationNumber,
						allocationDate: Date.now(),
				  }
				: ezData;

			// Batch update orders with invoice data
			const batch = admin.firestore().batch();
			orders.forEach((order) => {
				const orderRef = admin
					.firestore()
					.collection(
						FirebaseAPI.firestore.getPath({
							collectionName: "orders",
							companyId: auth?.token.companyId,
							storeId: auth?.token.storeId ?? "",
						})
					)
					.doc(order.id);

				// When this invoice was created from a single-order delivery note,
				// mark the embedded delivery note as paid using a dotted-path update
				// so we don't overwrite the rest of the deliveryNote subobject.
				if (params.parent && orders.length === 1) {
					batch.update(orderRef, {
						invoice: invoiceToPersist,
						"deliveryNote.status": "paid",
					});
				} else {
					batch.update(orderRef, { invoice: invoiceToPersist });
				}
			});
			await batch.commit();

			// Emit invoice_created event when the invoice was created from a
			// delivery note (params.parent set). Note: this event has NO AR effect —
			// debt was already accrued at delivery-note creation. The event is kept
			// for tax/reporting consumers only (e.g. notifications, audit logs).
			if (params.parent) {
				const invoiceAmount = Math.round(price_total * 100); // shekels → agorot
				await emitEvent<DocumentInvoiceCreatedPayload>({
					type: DocumentEventTypes.invoiceCreated,
					source: "documents",
					companyId: auth?.token.companyId ?? "",
					storeId: auth?.token.storeId ?? "",
					actorId: "system",
					payload: {
						orderId: orders[0].id,
						invoiceNumber: ezData.doc_number,
						invoiceDocUuid: ezData.doc_uuid,
						amount: invoiceAmount,
						companyId: auth?.token.companyId ?? "",
						storeId: auth?.token.storeId ?? "",
						...(orders[0].deliveryNote?.number
							? { deliveryNoteNumber: orders[0].deliveryNote.number }
							: {}),
						...(orders[0].organizationId
							? { organizationId: orders[0].organizationId }
							: {}),
						...(params.allocationNumber
							? { allocationNumber: params.allocationNumber }
							: {}),
					},
				});
			}

			return {
				success: true,
				data: res.data,
			};
		}

		functionsV2.logger.error("createInvoice: ezcount failure", {
			error: res.error?.message,
			storeId,
			orderIds: orders.map((o) => o.id),
		});

		return {
			success: false as const,
			error: res.error?.message ?? "ezcount_error",
		};
	}
);
