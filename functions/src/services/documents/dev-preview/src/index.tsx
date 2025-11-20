import * as React from "react";
import { createRoot } from "react-dom/client";
import { Invoice } from "../../templates/Invoice";
import { TOrder, TStore } from "@jsdev_ninja/core";

const testOrder: TOrder = {
	paymentStatus: "completed",
	cart: {
		cartDiscount: 100,
		cartTotal: 200,
		cartVat: 18,
		id: "cart-123",
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
					sku: "SKU-001",
				} as any,
			},
			{
				amount: 2,
				product: {
					brand: "שטראוס",
					categories: {} as any,
					categoryList: null as any,
					images: [
						{
							id: "",
							url: "https://images.unsplash.com/photo-1556910096-6f5e72db6803?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
						},
					],
					name: [{ lang: "he", value: "לחם" }],
					price: 12.5,
					sku: "SKU-002",
				} as any,
			},
		],
		deliveryPrice: 20,
	},
	client: {
		displayName: "יוסי חיים",
		email: "yossi@example.com",
		phoneNumber: "050-1234567",
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
	companyId: "company-123",
	date: Date.now(),
	id: "order-123",
	status: "pending",
	storeId: "store-123",
	type: "Order",
	userId: "user-123",
	deliveryDate: Date.now(),
	nameOnInvoice: "יוסי חיים בע״מ",
};

const testStore: TStore = {
	id: "store-123",
	companyId: "company-123",
	name: "חנות לדוגמה",
	urls: ["https://example.com"],
	logoUrl: "https://via.placeholder.com/150x80",
	tenantId: "tenant-123",
	paymentType: "j5",
	allowAnonymousClients: true,
	isVatIncludedInPrice: false,
	clientTypes: ["individual", "company"],
	minimumOrder: 50,
	freeDeliveryPrice: 200,
	deliveryPrice: 20,
};

function App() {
	return (
		<div style={{ padding: "20px", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
			<div
				style={{
					maxWidth: "1200px",
					margin: "0 auto",
					backgroundColor: "white",
					padding: "20px",
					boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
				}}
			>
				<h1 style={{ marginBottom: "20px" }}>Invoice Preview</h1>
				<Invoice order={testOrder} store={testStore} invoiceNumber="INV-001" />
			</div>
		</div>
	);
}

const rootElement = document.getElementById("root");
if (rootElement) {
	const root = createRoot(rootElement);
	root.render(<App />);
}
