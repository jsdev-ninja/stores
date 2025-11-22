import * as React from "react";
import { TOrder, TStore } from "@jsdev_ninja/core";
import { InvoiceLayout, CompanyDetails } from "./InvoiceLayout";

type InvoiceProps = {
	order: TOrder;
	store: TStore;
	invoiceNumber?: string;
	invoiceDate?: string;
};

export function Invoice({ order, store, invoiceNumber, invoiceDate }: InvoiceProps) {
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

	const { apartmentNumber, city, floor, street, streetNumber } = order.client.address ?? {};
	const fullAddress = `${city || ""}, ${street || ""} ${streetNumber || ""}${
		floor ? ` קומה ${floor}` : ""
	}${apartmentNumber ? `, דירה ${apartmentNumber}` : ""}`;

	const invoiceNum = invoiceNumber || order.invoice?.doc_number || order.id;
	const invoiceDateStr = invoiceDate || formatDate(order.date);

	const subtotal = order.cart.cartTotal - order.cart.cartVat;
	const vatAmount = order.cart.cartVat;
	const total = order.cart.cartTotal;
	const discount = order.cart.cartDiscount;
	const deliveryPrice = order.cart.deliveryPrice || 0;

	const companyDetails: CompanyDetails = {
		name: store.name,
	};

	return (
		<InvoiceLayout logoUrl={store.logoUrl} companyDetails={companyDetails}>

			{/* Invoice Title */}
			<h1
				style={{
					textAlign: "center",
					fontSize: "32px",
					fontWeight: "bold",
					marginBottom: "30px",
				}}
			>
				חשבונית מס
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
						מספר חשבונית
					</div>
					<div style={{ fontSize: "16px", fontWeight: "bold" }}>{invoiceNum}</div>
				</div>
				<div>
					<div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>תאריך</div>
					<div style={{ fontSize: "16px", fontWeight: "bold" }}>{invoiceDateStr}</div>
				</div>
				<div>
					<div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
						מספר הזמנה
					</div>
					<div style={{ fontSize: "16px", fontWeight: "bold" }}>{order.id}</div>
				</div>
			</div>

			{/* Client Section */}
			<div
				style={{
					marginBottom: "30px",
					padding: "20px",
					backgroundColor: "#f5f5f5",
					borderRadius: "8px",
				}}
			>
				<h2
					style={{
						fontSize: "18px",
						fontWeight: "bold",
						marginBottom: "15px",
						paddingBottom: "10px",
						borderBottom: "1px solid #ddd",
					}}
				>
					פרטי לקוח
				</h2>
				<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
					<div>
						<div
							style={{
								fontSize: "14px",
								fontWeight: "bold",
								color: "#666",
								marginBottom: "5px",
							}}
						>
							שם:
						</div>
						<div>{order.nameOnInvoice || order.client.displayName}</div>
					</div>
					<div>
						<div
							style={{
								fontSize: "14px",
								fontWeight: "bold",
								color: "#666",
								marginBottom: "5px",
							}}
						>
							אימייל:
						</div>
						<div>{order.client.email || "-"}</div>
					</div>
					<div>
						<div
							style={{
								fontSize: "14px",
								fontWeight: "bold",
								color: "#666",
								marginBottom: "5px",
							}}
						>
							טלפון:
						</div>
						<div>{order.client.phoneNumber || "-"}</div>
					</div>
					<div>
						<div
							style={{
								fontSize: "14px",
								fontWeight: "bold",
								color: "#666",
								marginBottom: "5px",
							}}
						>
							כתובת:
						</div>
						<div>{fullAddress || "-"}</div>
					</div>
				</div>
			</div>

			{/* Items Table */}
			<table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
				<thead>
					<tr style={{ backgroundColor: "#333", color: "#fff" }}>
						<th style={{ padding: "12px", textAlign: "center", width: "60px" }}>תמונה</th>
						<th style={{ padding: "12px", textAlign: "right" }}>מוצר</th>
						<th style={{ padding: "12px", textAlign: "center", width: "100px" }}>כמות</th>
						<th style={{ padding: "12px", textAlign: "left", width: "120px" }}>מחיר יחידה</th>
						<th style={{ padding: "12px", textAlign: "left", width: "120px" }}>סה"כ</th>
					</tr>
				</thead>
				<tbody>
					{order.cart.items.map((item, index) => (
						<tr key={index} style={{ borderBottom: "1px solid #ddd" }}>
							<td style={{ padding: "12px", textAlign: "center" }}>
								{item.product.images?.[0]?.url ? (
									<img
										src={item.product.images[0].url}
										alt={item.product.name[0]?.value || ""}
										style={{
											width: "50px",
											height: "50px",
											objectFit: "cover",
											borderRadius: "4px",
										}}
									/>
								) : (
									"-"
								)}
							</td>
							<td style={{ padding: "12px", textAlign: "right" }}>
								{item.product.name[0]?.value || ""}
							</td>
							<td style={{ padding: "12px", textAlign: "center" }}>{item.amount}</td>
							<td style={{ padding: "12px", textAlign: "left" }}>
								{formatCurrency(item.product.price)}
							</td>
							<td style={{ padding: "12px", textAlign: "left" }}>
								{formatCurrency(item.product.price * item.amount)}
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{/* Totals */}
			<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "30px" }}>
				<table style={{ width: "400px", borderCollapse: "collapse" }}>
					<tbody>
						{subtotal > 0 && (
							<tr>
								<td
									style={{
										padding: "10px 15px",
										textAlign: "right",
										fontWeight: "bold",
										color: "#666",
									}}
								>
									סה"כ לפני מע"מ:
								</td>
								<td style={{ padding: "10px 15px", textAlign: "left" }}>
									{formatCurrency(subtotal)}
								</td>
							</tr>
						)}
						{vatAmount > 0 && (
							<tr>
								<td
									style={{
										padding: "10px 15px",
										textAlign: "right",
										fontWeight: "bold",
										color: "#666",
									}}
								>
									מע"מ ({store.isVatIncludedInPrice ? "כולל" : "נוסף"}):
								</td>
								<td style={{ padding: "10px 15px", textAlign: "left" }}>
									{formatCurrency(vatAmount)}
								</td>
							</tr>
						)}
						{deliveryPrice > 0 && (
							<tr>
								<td
									style={{
										padding: "10px 15px",
										textAlign: "right",
										fontWeight: "bold",
										color: "#666",
									}}
								>
									משלוח:
								</td>
								<td style={{ padding: "10px 15px", textAlign: "left" }}>
									{formatCurrency(deliveryPrice)}
								</td>
							</tr>
						)}
						{discount > 0 && (
							<tr>
								<td
									style={{
										padding: "10px 15px",
										textAlign: "right",
										fontWeight: "bold",
										color: "#666",
									}}
								>
									הנחה:
								</td>
								<td style={{ padding: "10px 15px", textAlign: "left" }}>
									-{formatCurrency(discount)}
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
								סה"כ לתשלום:
							</td>
							<td
								style={{
									padding: "15px",
									textAlign: "left",
									fontSize: "20px",
									fontWeight: "bold",
								}}
							>
								{formatCurrency(total + deliveryPrice)}
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			{/* Comments */}
			{order.clientComment && (
				<div
					style={{
						marginBottom: "30px",
						padding: "20px",
						backgroundColor: "#f5f5f5",
						borderRadius: "8px",
					}}
				>
					<h2
						style={{
							fontSize: "18px",
							fontWeight: "bold",
							marginBottom: "15px",
							paddingBottom: "10px",
							borderBottom: "1px solid #ddd",
						}}
					>
						הערות
					</h2>
					<div>{order.clientComment}</div>
				</div>
			)}
		</InvoiceLayout>
	);
}
