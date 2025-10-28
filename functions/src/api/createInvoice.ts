import * as functionsV2 from "firebase-functions/v2";
import { ezCountService } from "../services/ezCountService";
import { TStorePrivate } from "src/schema";
import admin from "firebase-admin";

type TData = {
	params: Parameters<typeof ezCountService.createInvoice>[0];
	storeId: string;
};
export const createInvoice = functionsV2.https.onCall<TData, void>(async (request) => {
	const { data } = request;
	const { params, storeId } = data;
	console.log("createInvoice", request.auth?.uid);
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

	console.log("create invoice res", JSON.stringify(res));

	return {
		success: true,
		data: res.data,
	};
});
