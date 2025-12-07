import * as React from "react";
import { TOrder, TStore } from "@jsdev_ninja/core";
import { InvoiceLayout } from "./InvoiceLayout";

type DeliveryNoteProps = {
	order: TOrder;
	store: TStore;
	deliveryNoteNumber?: string;
	deliveryNoteDate?: string;
};

export function DeliveryNote({
	order,
	store,
	deliveryNoteNumber,
	deliveryNoteDate,
}: DeliveryNoteProps) {
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("he-IL", {
			style: "currency",
			currency: "ILS",
		}).format(amount);
	};

	const { apartmentNumber, city, floor, street, streetNumber } = order.client?.address ?? {};
	const fullAddress = `${city || ""}, ${street || ""} ${streetNumber || ""}${
		floor ? ` קומה ${floor}` : ""
	}${apartmentNumber ? `, דירה ${apartmentNumber}` : ""}`;

	const deliveryNoteNum = deliveryNoteNumber;
	const deliveryNoteDateStr = deliveryNoteDate;

	const cartTotal = order.cart.cartTotal || 0;
	const cartVat = order.cart.cartVat || 0;
	const subtotal = cartTotal - cartVat;
	const discount = order.cart.cartDiscount;
	const deliveryPrice = order.cart.deliveryPrice || 0;

	return (
		<InvoiceLayout store={store}>
			{/* Delivery Note Title */}
			<h1
				style={{
					textAlign: "center",
					fontSize: "32px",
					fontWeight: "bold",
					marginBottom: "15px",
				}}
			>
				תעודת משלוח
			</h1>

			{/* Delivery Note Info */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					marginBottom: "15px",
					padding: "15px",
					backgroundColor: "#f9f9f9",
					borderRadius: "8px",
				}}
			>
				<div>
					<div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
						מספר תעודת משלוח
					</div>
					<div style={{ fontSize: "16px", fontWeight: "bold" }}>{deliveryNoteNum}</div>
				</div>
				<div>
					<div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>תאריך</div>
					<div style={{ fontSize: "16px", fontWeight: "bold" }}>{deliveryNoteDateStr}</div>
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
					marginBottom: "15px",
					padding: "15px",
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
					פרטי הלקוח
				</h2>
				<div style={{ fontSize: "14px", lineHeight: "1.8" }}>
					<div style={{ fontWeight: "bold", marginBottom: "5px" }}>
						{order.nameOnInvoice ?? ""}
					</div>
					{order.client?.companyName && (
						<div style={{ marginBottom: "5px" }}>חברה: {order.client?.companyName}</div>
					)}
					{fullAddress && <div style={{ marginBottom: "5px" }}>כתובת: {fullAddress}</div>}
					{order.client?.phoneNumber && (
						<div style={{ marginBottom: "5px" }}>טלפון: {order.client?.phoneNumber}</div>
					)}
					{order.client?.email && <div>אימייל: {order.client?.email}</div>}
				</div>
			</div>

			{/* Items Table */}
			<div style={{ marginBottom: "15px" }}>
				<h2
					style={{
						fontSize: "20px",
						fontWeight: "bold",
						marginBottom: "20px",
						paddingBottom: "10px",
						borderBottom: "2px solid #333",
					}}
				>
					פריטים
				</h2>
				<table style={{ width: "100%", borderCollapse: "collapse" }}>
					<thead>
						<tr style={{ backgroundColor: "#333", color: "#fff" }}>
							<th style={{ padding: "12px", textAlign: "right" }}>שם פריט</th>
							<th style={{ padding: "12px", textAlign: "center" }}>כמות</th>
							<th style={{ padding: "12px", textAlign: "left" }}>מחיר יחידה</th>
							<th style={{ padding: "12px", textAlign: "left" }}>סה"כ</th>
						</tr>
					</thead>
					<tbody>
						{order.cart.items.map((item, index) => (
							<tr key={index} style={{ borderBottom: "1px solid #ddd" }}>
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
			</div>

			{/* Totals */}
			<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "15px" }}>
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
						{cartVat > 0 && (
							<tr>
								<td
									style={{
										padding: "10px 15px",
										textAlign: "right",
										fontWeight: "bold",
										color: "#666",
									}}
								>
									מע"מ:
								</td>
								<td style={{ padding: "10px 15px", textAlign: "left" }}>
									{formatCurrency(cartVat)}
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
								{formatCurrency(cartTotal)}
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</InvoiceLayout>
	);
}
