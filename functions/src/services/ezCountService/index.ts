import { TOrder } from "@jsdev_ninja/core";
import axios from "axios";

// application/json
// https://demo.ezcount.co.il
// https://api.ezcount.co.il
// const companyId = "balasistore_company";
// const storeId = "balasistore_store";

enum DOC_TYPE {
	ORDER = 100, // הזמנה (Order)
	DELIVERY = 200, // תעודת משלוח (Delivery)
	RETURN = 210, // תעודת החזרה (Return)
	PROFORMA_INVOICE = 300, // חשבונית עסקה (Proforma Invoice)
	TAX_INVOICE = 305, // חשבונית מס(Tax invoice)
	INVOICE_RECEIPT = 320, // חשבונית מס קבלה(Invoice Receipt)
	CREDIT_INVOICE = 330, // חשבונית זיכוי(Credit invoice)
	RECEIPT = 400, // קבלה(Receipt)
	RECEIPT_DONATION = 405, // קבלה על תרומה(Receipt for donation)
	PURCHASE_ORDER = 500, // הזמנת רכש(Purchase order)
	BID = 9999, // הצעת מחיר(Bid)
	DEPOSIT_APPROVAL = 9998, // קבלת פקדון (Deposit Approval)
	DEPOSIT_RELEASE = 9997, // קבלת פקדון (Deposit Release)
}

enum VAT_TYPE {
	PRE = "PRE",
	INC = "INC",
}

type Params = {
	url: string;
	api_key: string;
	transaction_id: string;
	doc_type: DOC_TYPE;
	customer_name: string;
	customer_email: string;
	customer_address?: string;
	customer_phone?: string;
	description?: string;
	parent?: string; // parens docs (1,2,3,4)
	cc_emails?: string[];
};

export async function createDocument(params: Params) {
	try {
		const res = await axios({
			method: "post",
			maxBodyLength: Infinity,
			url: `${params.url}/api/createDoc`, //todo handle api vs demo
			headers: {
				"Content-Type": "application/json",
			},
			data: {
				developer_email: "philip@jsdev.ninja",
				api_key: params.api_key,
				type: DOC_TYPE.DELIVERY,
				auto_balance: true,
				customer_name: params.customer_name,
				customer_email: params.customer_email,
				customer_address: params.customer_address,
				customer_phone: params.customer_phone,
				description: params.description,
				parent: params.parent,
			},
		});
	} catch (error: any) {
		console.error(error.message);
	}
}
export const ezCountService = {
	async createDeliveryNote(
		order: TOrder,
		{
			ezcount_key,
			ezcount_api,
			clientEmail,
			clientName,
		}: { ezcount_key: string; clientName: string; clientEmail: string; ezcount_api: string }
	) {
		try {
			console.log("createDeliveryNote", clientEmail, clientName);
			console.log("URLLLL", `${ezcount_api}/api/createDoc`);

			const items = order.cart.items.map((item) => {
				return {
					// catalog_number: item.product.sku,
					details: item.product.name[0].value,
					price: item.product.price,
					amount: item.amount,
					vat_type: item.product.vat ? VAT_TYPE.PRE : VAT_TYPE.INC,
				};
			});
			const data = JSON.stringify({
				developer_email: "philip@jsdev.ninja",
				api_key: ezcount_key,
				type: DOC_TYPE.DELIVERY,
				customer_name: clientName,
				customer_email: clientEmail,
				item: items,
				// payment: [
				// 	{
				// 		payment_type: 9,
				// 		payment_sum: order.cart.cartTotal,
				// 		other_payment_type_name: "תשלום עתידי",
				// 	},
				// ],
				price_total: order.cart.cartTotal,
			});

			const res = await axios({
				method: "post",
				maxBodyLength: Infinity,
				url: `${ezcount_api}/api/createDoc`, //todo handle api vs demo
				headers: {
					"Content-Type": "application/json",
				},
				data: data,
			});

			console.log("res", res.status);
			console.log(JSON.stringify(res.data));
			return { error: null, data: res.data };
		} catch (error: any) {
			console.error(error.message);
			return { error, data: null };
		}
	},
};
