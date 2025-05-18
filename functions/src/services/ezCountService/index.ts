import { TOrder } from "@jsdev_ninja/core";
import axios from "axios";

// application/json
// https://demo.ezcount.co.il
// https://api.ezcount.co.il
// const companyId = "balasistore_company";
// const storeId = "balasistore_store";

enum DOC_TYPE {
	DELIVERY = 200,
}

enum VAT_TYPE {
	PRE = "PRE",
	INC = "INC",
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
		} catch (error: any) {
			console.error(error.message);
		}
	},
};
