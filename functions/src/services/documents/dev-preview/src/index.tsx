import * as React from "react";
import { createRoot } from "react-dom/client";
import { TOrder, TStore, TDeliveryNote } from "@jsdev_ninja/core";
import { InvoiceLayout } from "../../templates/InvoiceLayout";
import { Invoice } from "../../templates/Invoice";
import { ConsolidatedInvoice } from "../../templates/ConsolidatedInvoice";

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
	const [activeTab, setActiveTab] = React.useState<"invoice" | "consolidated">("invoice");

	// Create test orders with delivery notes for consolidated invoice
	const testOrderWithDeliveryNote1: TOrder = {
		...testOrder,
		id: "order-123",
		deliveryNote: {
			doc_uuid: "uuid-1",
			pdf_link: "https://example.com/pdf1",
			pdf_link_copy: "https://example.com/pdf1-copy",
			doc_number: "DN-001",
			sent_mails: ["test@example.com"],
			success: true,
			ua_uuid: "ua-uuid-1",
			calculatedData: {
				transaction_id: "trans-1",
				date: "2024-01-15",
				currency: "ILS",
				rate: 1,
				vat: "17.00",
				vat_price: 34,
				price_discount: 10,
				price_discount_in_currency: 10,
				price_total: "234.00",
				price_total_in_currency: 234,
			},
			date: Date.now() - 86400000, // Yesterday
		} as TDeliveryNote,
	};

	const testOrderWithDeliveryNote2: TOrder = {
		...testOrder,
		id: "order-456",
		deliveryNote: {
			doc_uuid: "uuid-2",
			pdf_link: "https://example.com/pdf2",
			pdf_link_copy: "https://example.com/pdf2-copy",
			doc_number: "DN-002",
			sent_mails: ["test@example.com"],
			success: true,
			ua_uuid: "ua-uuid-2",
			calculatedData: {
				transaction_id: "trans-2",
				date: "2024-01-16",
				currency: "ILS",
				rate: 1,
				vat: "17.00",
				vat_price: 51,
				price_discount: 0,
				price_discount_in_currency: 0,
				price_total: "351.00",
				price_total_in_currency: 351,
			},
			date: Date.now(), // Today
		} as TDeliveryNote,
	};

	// Create an order with exempt delivery note (no VAT)
	const testOrderExempt: TOrder = {
		...testOrder,
		id: "order-789",
		deliveryNote: {
			doc_uuid: "uuid-3",
			pdf_link: "https://example.com/pdf3",
			pdf_link_copy: "https://example.com/pdf3-copy",
			doc_number: "DN-003",
			sent_mails: ["test@example.com"],
			success: true,
			ua_uuid: "ua-uuid-3",
			calculatedData: {
				transaction_id: "trans-3",
				date: "2024-01-17",
				currency: "ILS",
				rate: 1,
				vat: "0.00",
				vat_price: 0, // Exempt from VAT
				price_discount: 0,
				price_discount_in_currency: 0,
				price_total: "200.00",
				price_total_in_currency: 200,
			},
			date: Date.now(),
		} as TDeliveryNote,
	};

	const testOrdersWithDeliveryNotes = [
		testOrderWithDeliveryNote1,
		testOrderWithDeliveryNote2,
		testOrderExempt,
	];

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

				{/* Tabs */}
				<div
					style={{
						display: "flex",
						gap: "10px",
						marginBottom: "20px",
						borderBottom: "2px solid #ddd",
					}}
				>
					<button
						onClick={() => setActiveTab("invoice")}
						style={{
							padding: "10px 20px",
							border: "none",
							backgroundColor: activeTab === "invoice" ? "#333" : "transparent",
							color: activeTab === "invoice" ? "#fff" : "#333",
							cursor: "pointer",
							fontSize: "16px",
							fontWeight: activeTab === "invoice" ? "bold" : "normal",
							borderBottom: activeTab === "invoice" ? "3px solid #333" : "3px solid transparent",
							marginBottom: "-2px",
						}}
					>
						חשבונית
					</button>
					<button
						onClick={() => setActiveTab("consolidated")}
						style={{
							padding: "10px 20px",
							border: "none",
							backgroundColor: activeTab === "consolidated" ? "#333" : "transparent",
							color: activeTab === "consolidated" ? "#fff" : "#333",
							cursor: "pointer",
							fontSize: "16px",
							fontWeight: activeTab === "consolidated" ? "bold" : "normal",
							borderBottom:
								activeTab === "consolidated" ? "3px solid #333" : "3px solid transparent",
							marginBottom: "-2px",
						}}
					>
						חשבונית מאוחדת
					</button>
				</div>

				{/* Content */}
				{activeTab === "invoice" && (
					<InvoiceLayout companyDetails={{ name: testStore.name }} logoUrl={testStore.logoUrl}>
						<Invoice order={testOrder} store={testStore} invoiceNumber="INV-001" />
					</InvoiceLayout>
				)}

				{activeTab === "consolidated" && (
					<ConsolidatedInvoice
						orders={testOrdersWithDeliveryNotes}
						store={testStore}
						invoiceNumber="CONS-001"
					/>
				)}
			</div>
		</div>
	);
}

const rootElement = document.getElementById("root");
if (rootElement) {
	const root = createRoot(rootElement);
	root.render(<App />);
}
