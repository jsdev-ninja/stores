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
export const ezCountService = {
	async createDeliveryNote(order: TOrder) {
		try {
			const items = order.cart.items.map((item) => {
				return {
					// catalog_number: item.product.sku,
					details: item.product.name[0].value,
					price: item.product.price,
					amount: item.amount,
				};
			});
			const data = JSON.stringify({
				developer_email: "philip@jsdev.ninja",
				api_key: "225559783aa58c28b6f64b4d5b5d6fd96cf2996668e5212255d908ce73fd2b8d",
				type: DOC_TYPE.DELIVERY,
				customer_name: "Israel Israeli",
				customer_email: "philip@jsdev.ninja",
				item: items,
				payment: [
					{
						payment_type: 9,
						payment_sum: order.cart.cartTotal,
						other_payment_type_name: "תשלום עתידי",
					},
				],
				price_total: order.cart.cartTotal,
			});

			const res = await axios({
				method: "post",
				maxBodyLength: Infinity,
				url: "https://demo.ezcount.co.il/api/createDoc",
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
