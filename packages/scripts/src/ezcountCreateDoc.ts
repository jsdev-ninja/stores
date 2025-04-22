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

async function main() {
	try {
		const data = JSON.stringify({
			developer_email: "philip@jsdev.ninja",
			api_key: "225559783aa58c28b6f64b4d5b5d6fd96cf2996668e5212255d908ce73fd2b8d",
			type: 320,
			customer_name: "Israel Israeli",
			item: [
				{
					catalog_number: "MKT1",
					details: "1 kg of Internet",
					price: 120,
					amount: 1,
				},
			],
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
