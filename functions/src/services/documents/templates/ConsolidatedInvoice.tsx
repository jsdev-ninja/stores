import * as React from "react";
import { TOrder, TStore, TDeliveryNote } from "@jsdev_ninja/core";
import { InvoiceLayout, CompanyDetails } from "./InvoiceLayout";

type ConsolidatedInvoiceProps = {
	orders: TOrder[];
	store: TStore;
	invoiceNumber?: string;
	invoiceDate?: string;
};

export function ConsolidatedInvoice({
	orders,
	store,
	invoiceNumber,
	invoiceDate,
}: ConsolidatedInvoiceProps) {
	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleDateString("he-IL", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("he-IL", {
			style: "currency",
			currency: "ILS",
		}).format(amount);
	};

	// Filter orders that have delivery notes
	const ordersWithDeliveryNotes = orders.filter((order) => order.deliveryNote);

	// Calculate totals from all delivery notes
	// Separate taxable (with VAT) and exempt (without VAT) amounts
	let totalTaxable = 0; // סה"כ חייב במע"מ
	let totalExempt = 0; // סה"כ פטור ממע"מ
	let totalVat = 0; // סה"כ מע"מ

	ordersWithDeliveryNotes.forEach((order) => {
		const deliveryNote = order.deliveryNote!;
		const vatPrice = deliveryNote.calculatedData.vat_price || 0;
		const totalPrice = deliveryNote.calculatedData.price_total_in_currency || 0;
		const subtotalPrice = totalPrice - vatPrice;

		if (vatPrice > 0) {
			// Taxable - has VAT
			totalTaxable += subtotalPrice;
			totalVat += vatPrice;
		} else {
			// Exempt - no VAT
			totalExempt += totalPrice;
		}
	});

	const grandTotal = totalTaxable + totalVat + totalExempt;

	const invoiceNum = invoiceNumber || `CONS-${Date.now()}`;
	const invoiceDateStr = invoiceDate || formatDate(Date.now());

	const companyDetails: CompanyDetails = {
		name: store.name,
	};

	return (
		<InvoiceLayout logoUrl={store.logoUrl} companyDetails={companyDetails}>
			{/* Consolidated Invoice Title */}
			<h1
				style={{
					textAlign: "center",
					fontSize: "32px",
					fontWeight: "bold",
					marginBottom: "30px",
				}}
			>
				חשבונית מס מאוחדת
			</h1>

			{/* Invoice Info */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					marginBottom: "30px",
					padding: "20px",
					backgroundColor: "#f9f9f9",
					borderRadius: "8px",
				}}
			>
				<div>
					<div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
						מספר חשבונית מאוחדת
					</div>
					<div style={{ fontSize: "16px", fontWeight: "bold" }}>{invoiceNum}</div>
				</div>
				<div>
					<div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>תאריך</div>
					<div style={{ fontSize: "16px", fontWeight: "bold" }}>{invoiceDateStr}</div>
				</div>
				<div>
					<div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
						מספר אסמכתאות משלוח
					</div>
					<div style={{ fontSize: "16px", fontWeight: "bold" }}>
						{ordersWithDeliveryNotes.length}
					</div>
				</div>
			</div>

			{/* Delivery Notes List */}
			<div style={{ marginBottom: "30px" }}>
				<h2
					style={{
						fontSize: "20px",
						fontWeight: "bold",
						marginBottom: "20px",
						paddingBottom: "10px",
						borderBottom: "2px solid #333",
					}}
				>
					אסמכתאות משלוח
				</h2>

				<table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
					<thead>
						<tr style={{ backgroundColor: "#333", color: "#fff" }}>
							<th style={{ padding: "12px", textAlign: "right" }}>מספר אסמכתא</th>
							<th style={{ padding: "12px", textAlign: "center" }}>תאריך</th>
							<th style={{ padding: "12px", textAlign: "left", width: "120px" }}>
								סה"כ לפני מע"מ
							</th>
							<th style={{ padding: "12px", textAlign: "left", width: "120px" }}>מע"מ</th>
							<th style={{ padding: "12px", textAlign: "left", width: "120px" }}>סה"כ</th>
						</tr>
					</thead>
					<tbody>
						{ordersWithDeliveryNotes.map((order, index) => {
							const deliveryNote = order.deliveryNote!;
							const noteSubtotal =
								deliveryNote.calculatedData.price_total_in_currency -
								deliveryNote.calculatedData.vat_price;
							return (
								<tr key={index} style={{ borderBottom: "1px solid #ddd" }}>
									<td style={{ padding: "12px", textAlign: "right", fontWeight: "bold" }}>
										{deliveryNote.doc_number}
									</td>
									<td style={{ padding: "12px", textAlign: "center" }}>
										{deliveryNote.date
											? formatDate(deliveryNote.date)
											: formatDate(order.date)}
									</td>
									<td style={{ padding: "12px", textAlign: "left" }}>
										{formatCurrency(noteSubtotal)}
									</td>
									<td style={{ padding: "12px", textAlign: "left" }}>
										{formatCurrency(deliveryNote.calculatedData.vat_price)}
									</td>
									<td style={{ padding: "12px", textAlign: "left", fontWeight: "bold" }}>
										{formatCurrency(deliveryNote.calculatedData.price_total_in_currency)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Totals Summary */}
			<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "30px" }}>
				<table style={{ width: "400px", borderCollapse: "collapse" }}>
					<tbody>
						{totalTaxable > 0 && (
							<tr>
								<td
									style={{
										padding: "10px 15px",
										textAlign: "right",
										fontWeight: "bold",
										color: "#666",
									}}
								>
									סה"כ חייב במע"מ:
								</td>
								<td style={{ padding: "10px 15px", textAlign: "left" }}>
									{formatCurrency(totalTaxable)}
								</td>
							</tr>
						)}
						{totalExempt > 0 && (
							<tr>
								<td
									style={{
										padding: "10px 15px",
										textAlign: "right",
										fontWeight: "bold",
										color: "#666",
									}}
								>
									סה"כ פטור ממע"מ:
								</td>
								<td style={{ padding: "10px 15px", textAlign: "left" }}>
									{formatCurrency(totalExempt)}
								</td>
							</tr>
						)}
						{totalVat > 0 && (
							<tr>
								<td
									style={{
										padding: "10px 15px",
										textAlign: "right",
										fontWeight: "bold",
										color: "#666",
									}}
								>
									סה"כ מע"מ:
								</td>
								<td style={{ padding: "10px 15px", textAlign: "left" }}>
									{formatCurrency(totalVat)}
								</td>
							</tr>
						)}
						<tr style={{ borderTop: "2px solid #333" }}>
							<td
								style={{
									padding: "15px",
									textAlign: "right",
									fontSize: "18px",
									fontWeight: "bold",
								}}
							>
								סה"כ:
							</td>
							<td
								style={{
									padding: "15px",
									textAlign: "left",
									fontSize: "20px",
									fontWeight: "bold",
								}}
							>
								{formatCurrency(grandTotal)}
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</InvoiceLayout>
	);
}
