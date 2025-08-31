import { TProduct, ProductSchema, TCategory, FirebaseAPI } from "@jsdev_ninja/core";
import { getDownloadURL } from "firebase-admin/storage";
import _allProducts from "./data/all-products.json";
import axios from "axios";
import { admin } from "./admin";

// application/json
// https://demo.ezcount.co.il
// https://api.ezcount.co.il
const companyId = "balasistore_company";
const storeId = "balasistore_store";

const db = admin.firestore();

main();
//  e10a31a8-209c-4c54-ad4e-f70aae567a03
//  e10a31a8-209c-4c54-ad4e-f70aae567a03

async function main() {
	try {
		const data = JSON.stringify({
			developer_email: "philip@jsdev.ninja",
			ua_uuid: null,
			transaction_id: "1234567891_new",
			api_key: "7f39b2a164e4f6443df0bc1e14595f8de550f3ed1db72dc0b92008f90d44cffd",
			type: 320,
			parent: "e10a31a8-209c-4c54-ad4e-f70aae567a03,3d34be16-2b81-4fde-a7bb-124e89bccdd3",
			customer_name: "Israel Israeli",
			customer_email: "philip@jsdev.ninja",
			item: [
				{
					catalog_number: "MKT1",
					details: "1 kg of Internet",
					price: 120,
					amount: 1,
				},
			],
			// parent: "1",
			payment: [
				{
					payment_type: 3,
					payment_sum: 120,
					cc_type: 2,
					cc_type_name: "Visa",
					cc_number: "9876",
					cc_deal_type: 1,
					cc_num_of_payments: 1,
					cc_payment_num: 1,
				},
			],
			price_total: 120,
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

		console.log(res.data);
		console.log("res", res.status);
	} catch (error) {
		console.log(error);
	}
}
