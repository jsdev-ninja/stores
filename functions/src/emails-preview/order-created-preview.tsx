import * as React from "react";
import { TOrder } from "@jsdev_ninja/core";
import OrderCreated from "../emails/OrderCreated";

const testOrder: TOrder = {
	paymentStatus: "completed",
	cart: {
		cartDiscount: 100,
		cartTotal: 200,
		cartVat: 18,
		id: "",
		items: [
			{
				amount: 3,
				product: {
					brand: "תנובה",
					categories: {} as any,
					categoryList: null as any,
					images: [
						{
							id: "",
							url: "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?q=80&w=2156&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
						},
					],
					name: [{ lang: "he", value: "חלב" }],
					price: 9.9,
				} as any,
			},
		],
	},
	client: {
		displayName: "יוסי חיים",
		address: {
			apartmentEnterNumber: "1",
			apartmentNumber: "1",
			city: "רמת גן",
			country: "ישראל",
			floor: "1",
			street: "הראה",
			streetNumber: "58",
		},
	} as any,
	companyId: "",
	date: Date.now(),
	id: "",
	status: "pending",
	storeId: "",
	type: "Order",
	userId: "",
	deliveryDate: 0,
};

function OrderCreated2() {
	return <OrderCreated order={testOrder} />;
}

export default OrderCreated2;
