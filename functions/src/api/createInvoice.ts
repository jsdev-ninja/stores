import * as functionsV2 from "firebase-functions/v2";
import { ezCountService } from "../services/ezCountService";
import { TStorePrivate } from "src/schema";
import admin from "firebase-admin";
import { FirebaseAPI, TOrder } from "@jsdev_ninja/core";

type TData = {
	params: Parameters<typeof ezCountService.createInvoice>[0];
	storeId: string;
	orders: TOrder[];
};

// create invoice in HYP
export const createInvoice = functionsV2.https.onCall<TData, void>(async (request) => {
	const { data, auth } = request;
	const { params, storeId, orders } = data;
	console.log("createInvoice auth", request.auth);
	console.log("create invoice data", JSON.stringify(data));

	const storePrivateData: TStorePrivate = (
		await admin.firestore().collection(`STORES/${storeId}/private`).doc("data").get()
	).data() as TStorePrivate;

	console.log("storePrivateData", JSON.stringify(storePrivateData));

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
			{ payment_type: 9, payment_sum: params.price_total ?? 0, other_payment_type_name: "אחר" },
		],
		cc_emails: params.cc_emails,
	});

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
});
