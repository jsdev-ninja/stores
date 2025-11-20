import * as functionsV2 from "firebase-functions/v2";
import { ezCountService } from "../services/ezCountService";
// import { documentsService } from "../services/documents";
import { TStorePrivate } from "src/schema";
import admin from "firebase-admin";
import { FirebaseAPI, TOrder, TStore } from "@jsdev_ninja/core";

type TData = {
	params: Parameters<typeof ezCountService.createInvoice>[0];
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

		const storePrivateData: TStorePrivate = (
			await admin.firestore().collection(`STORES/${storeId}/private`).doc("data").get()
		).data() as TStorePrivate;

		// Get store data for PDF generation
		const store: TStore = (
			await admin.firestore().collection("STORES").doc(storeId).get()
		).data() as TStore;

		const res = await ezCountService.createInvoice({
			api_key: storePrivateData.ezcount_key,
			url: storePrivateData.ezcount_api,
			transaction_id: params.transaction_id,
			customer_name: params.customer_name,
			customer_email: params.customer_email,
			customer_address: params.customer_address,
			customer_phone: params.customer_phone,
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

		// const pdfUrl = await documentsService.generateAndUploadInvoicePDF({
		// 	order: orders[0],
		// 	store,
		// 	invoiceNumber: res.data?.doc_number,
		// 	invoiceDate: params.date,
		// 	companyId: auth?.token.companyId ?? "",
		// 	storeId: auth?.token.storeId ?? "",
		// 	orderId: "123",
		// });
		// console.log("pdfUrl", pdfUrl);
		if (!res.error) {
			// batch update orders with invoice data
			const batch = admin.firestore().batch();
			orders.forEach((order) => {
				batch.update(
					admin
						.firestore()
						.collection(
							FirebaseAPI.firestore.getPath({
								collectionName: "orders",
								companyId: auth?.token.companyId,
								storeId: auth?.token.storeId ?? "",
							})
						)
						.doc(order.id),
					{
						invoice: res.data,
					}
				);
			});
			await batch.commit();
			return {
				success: true,
				data: res.data,
			};
		}

		console.log("create invoice res", JSON.stringify(res));

		return {
			success: true,
			data: res.data,
		};
	}
);
