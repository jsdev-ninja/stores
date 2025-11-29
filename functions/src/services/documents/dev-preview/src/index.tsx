import * as React from "react";
import { createRoot } from "react-dom/client";
import { TOrder, TStore, TDeliveryNote } from "@jsdev_ninja/core";
import { InvoiceLayout } from "../../templates/InvoiceLayout";
import { Invoice } from "../../templates/Invoice";
import { ConsolidatedInvoice } from "../../templates/ConsolidatedInvoice";
import { DeliveryNote } from "../../templates/DeliveryNote";

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
	logoUrl:
		"data:image/jpeg;base64,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",
	tenantId: "tenant-123",
	paymentType: "j5",
	allowAnonymousClients: true,
	isVatIncludedInPrice: false,
	clientTypes: ["individual", "company"],
	minimumOrder: 50,
	freeDeliveryPrice: 200,
	deliveryPrice: 20,
	companyNumber: "1234567890",
	address: {
		apartmentEnterNumber: "1",
		apartmentNumber: "1",
		city: "רמת גן",
		country: "ישראל",
		floor: "1",
		street: "הראה",
		streetNumber: "58",
	},
};

function App() {
	const [activeTab, setActiveTab] = React.useState<"invoice" | "consolidated" | "deliveryNote">(
		"invoice"
	);

	// Create test orders with delivery notes for consolidated invoice
	const testOrderWithDeliveryNote1: TOrder = {
		...testOrder,
		id: "order-123",
		deliveryNote: {} as TDeliveryNote,
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
							borderBottom:
								activeTab === "invoice" ? "3px solid #333" : "3px solid transparent",
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
						חשבונית מרכזת
					</button>
					<button
						onClick={() => setActiveTab("deliveryNote")}
						style={{
							padding: "10px 20px",
							border: "none",
							backgroundColor: activeTab === "deliveryNote" ? "#333" : "transparent",
							color: activeTab === "deliveryNote" ? "#fff" : "#333",
							cursor: "pointer",
							fontSize: "16px",
							fontWeight: activeTab === "deliveryNote" ? "bold" : "normal",
							borderBottom:
								activeTab === "deliveryNote" ? "3px solid #333" : "3px solid transparent",
							marginBottom: "-2px",
						}}
					>
						תעודת משלוח
					</button>
				</div>

				{/* Content */}
				{activeTab === "invoice" && (
					<Invoice order={testOrder} store={testStore} invoiceNumber="INV-001" />
				)}

				{activeTab === "consolidated" && (
					<ConsolidatedInvoice
						orders={testOrdersWithDeliveryNotes}
						store={testStore}
						invoiceNumber="CONS-001"
					/>
				)}

				{activeTab === "deliveryNote" && (
					<DeliveryNote
						order={testOrderWithDeliveryNote1}
						store={testStore}
						deliveryNoteNumber="DN-001"
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
