import * as React from "react";
import { TOrder, TStore } from "@jsdev_ninja/core";

type InvoiceProps = {
	order: TOrder;
	store: TStore;
	invoiceNumber?: string;
	invoiceDate?: string;
	/** חשבונית ישראל allocation number. Falls back to the value stored on the order's invoice. */
	allocationNumber?: string;
	/** Epoch millis the allocation number was issued. Falls back to the order's invoice. */
	allocationDate?: number;
};

// Demo-matched palette (see demo/balasi-store-site / admin.css dn-* classes).
const GREEN_DARK = "#0d4f3a";
const GREEN = "#1b7a3d";
const INK = "#1a1a17";
const ORANGE = "#e8804a";
const PAPER = "#f8f6f0";
const LINE = "#e0dccd";

export function Invoice({
	order,
	store,
	invoiceNumber,
	invoiceDate,
	allocationNumber,
	allocationDate,
}: InvoiceProps) {
	const formatDate = (timestamp: number) =>
		new Date(timestamp).toLocaleDateString("he-IL", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});

	const formatCurrency = (amount: number) =>
		new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(amount);

	const { apartmentNumber, city, floor, street, streetNumber } = order.client?.address ?? {};
	const fullAddress = `${city || ""}${street ? `, ${street} ${streetNumber || ""}` : ""}${
		floor ? ` קומה ${floor}` : ""
	}${apartmentNumber ? `, דירה ${apartmentNumber}` : ""}`.trim();

	const invoiceNum = invoiceNumber || order.invoice?.number;
	const invoiceDateStr = invoiceDate || formatDate(order.date);

	// Allocation number / date may be supplied as a prop or persisted on the order's invoice.
	const invoiceAny = order.invoice as unknown as
		| { allocationNumber?: string; allocationDate?: number }
		| undefined;
	const alloc = allocationNumber ?? invoiceAny?.allocationNumber;
	const allocDate = allocationDate ?? invoiceAny?.allocationDate;

	// Store address (sender)
	const sa = store.address;
	const storeAddress = sa
		? [sa.street && `${sa.street} ${sa.streetNumber || ""}`.trim(), sa.city]
				.filter(Boolean)
				.join(", ")
		: "";

	const subtotal = order.cart.cartTotal - order.cart.cartVat;
	const vatAmount = order.cart.cartVat;
	const discount = order.cart.cartDiscount;
	const deliveryPrice = order.cart.deliveryPrice || 0;
	const grandTotal = order.cart.cartTotal + deliveryPrice;

	// Actual VAT rate derived from the amounts (falls back to 18%).
	const vatPct = subtotal > 0 ? Math.round((vatAmount / subtotal) * 100) : 18;

	// Due date: net-30 from issue (payment terms aren't stored).
	const dueDateStr = formatDate(order.date + 30 * 24 * 60 * 60 * 1000);

	// Balance: unpaid until invoicePaidAt is set on the order.
	const paidAt = (order as { invoicePaidAt?: number }).invoicePaidAt;
	const balance = paidAt ? 0 : grandTotal;

	const customerName = order.nameOnInvoice || order.client?.displayName || "—";

	// shared cell styles
	const th = (align: "right" | "center" | "left", width?: number): React.CSSProperties => ({
		padding: "11px 10px",
		fontWeight: 700,
		fontSize: "11px",
		letterSpacing: ".06em",
		textAlign: align,
		...(width ? { width } : {}),
	});
	const td: React.CSSProperties = {
		padding: "11px 10px",
		borderBottom: `1px solid #efeadb`,
		verticalAlign: "middle",
	};
	const totRow: React.CSSProperties = {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		padding: "9px 16px",
		fontSize: "13px",
		borderBottom: "1px solid #efeadb",
	};
	const totSpan: React.CSSProperties = { color: "#3a3630" };
	const totBold: React.CSSProperties = { color: INK, fontWeight: 800, fontSize: "13.5px" };
	const rLabel: React.CSSProperties = {
		fontSize: "10.5px",
		letterSpacing: ".06em",
		color: "#807a6e",
		fontWeight: 600,
		marginBottom: "2px",
		display: "block",
	};
	const rCol: React.CSSProperties = { display: "flex", flexDirection: "column", lineHeight: 1.4 };

	return (
		<div
			style={{
				maxWidth: "800px",
				margin: "0 auto",
				background: "#fff",
				color: INK,
				fontFamily: "Arial, 'Heebo', sans-serif",
				direction: "rtl",
				lineHeight: 1.5,
				border: `1px solid ${LINE}`,
			}}
		>
			{/* ===== HEADER ===== */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					gap: "24px",
					alignItems: "flex-start",
					padding: "28px 32px 22px",
					background: `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN} 100%)`,
					color: "#fff",
				}}
			>
				{/* sender (right in RTL) */}
				<div style={{ display: "flex", gap: "18px", alignItems: "flex-start" }}>
					{store.logoUrl && (
						<img
							src={store.logoUrl}
							alt={store.name}
							style={{ height: "54px", background: "#fff", padding: "6px 10px", borderRadius: "6px" }}
						/>
					)}
					<div style={{ display: "flex", flexDirection: "column", gap: "1px", fontSize: "12px" }}>
						<b style={{ fontSize: "16px", fontWeight: 800, marginBottom: "3px" }}>
							{store.name || "Store Name"}
						</b>
						{storeAddress && <span style={{ opacity: 0.85 }}>{storeAddress}</span>}
						{store.companyNumber && <span style={{ opacity: 0.85 }}>ח.פ {store.companyNumber}</span>}
					</div>
				</div>

				{/* document meta (left in RTL) */}
				<div
					style={{
						textAlign: "left",
						display: "flex",
						flexDirection: "column",
						gap: "4px",
						minWidth: "230px",
					}}
				>
					<div
						style={{
							fontSize: "24px",
							fontWeight: 900,
							lineHeight: 1,
							color: "#fff",
							borderRight: `4px solid ${ORANGE}`,
							paddingRight: "12px",
						}}
					>
						חשבונית מס
					</div>
					{invoiceNum && (
						<div
							style={{
								fontFamily: "monospace",
								fontSize: "13px",
								letterSpacing: "0.5px",
								background: "rgba(255,255,255,.15)",
								padding: "4px 10px",
								display: "inline-block",
								width: "fit-content",
								margin: "6px 0 4px auto",
								border: "1px solid rgba(255,255,255,.25)",
							}}
						>
							{invoiceNum}
						</div>
					)}
					<div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "12px", marginTop: "6px" }}>
						<div style={{ display: "flex", justifyContent: "space-between", gap: "14px" }}>
							<span style={{ opacity: 0.75 }}>תאריך הפקה:</span>
							<b style={{ fontWeight: 700 }}>{invoiceDateStr}</b>
						</div>
						<div style={{ display: "flex", justifyContent: "space-between", gap: "14px" }}>
							<span style={{ opacity: 0.75 }}>לתשלום עד:</span>
							<b style={{ fontWeight: 700 }}>{dueDateStr}</b>
						</div>
						<div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "center" }}>
							<span style={{ opacity: 0.75 }}>מספר הקצאה:</span>
							{alloc ? (
								<b
									style={{
										color: GREEN_DARK,
										background: "#e8f4ea",
										padding: "2px 8px",
										borderRadius: "3px",
										letterSpacing: "0.5px",
										fontWeight: 700,
									}}
								>
									{alloc}
								</b>
							) : (
								<b style={{ fontWeight: 700, opacity: 0.6 }}>—</b>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* ===== RECIPIENT ===== */}
			<div style={{ padding: "18px 32px 16px", background: PAPER, borderBottom: `1px solid ${LINE}` }}>
				<div
					style={{
						fontSize: "11px",
						letterSpacing: ".16em",
						textTransform: "uppercase",
						fontWeight: 800,
						color: "#a08465",
						marginBottom: "10px",
					}}
				>
					לכבוד
				</div>
				<div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px 28px" }}>
					<div style={rCol}>
						<span style={rLabel}>שם הלקוח</span>
						<b style={{ fontSize: "16px", color: INK, fontWeight: 700 }}>{customerName}</b>
						{order.companyNumber && (
							<span style={{ fontSize: "12px", color: "#807a6e" }}>ח.פ {order.companyNumber}</span>
						)}
					</div>
					<div style={rCol}>
						<span style={rLabel}>כתובת אספקה</span>
						<b style={{ fontSize: "14px", color: INK, fontWeight: 700 }}>{fullAddress || "—"}</b>
					</div>
					<div style={rCol}>
						<span style={rLabel}>טלפון</span>
						<b style={{ fontSize: "14px", color: INK, fontWeight: 700 }}>
							{order.client?.phoneNumber || "—"}
						</b>
					</div>
					<div style={rCol}>
						<span style={rLabel}>אימייל</span>
						<b style={{ fontSize: "14px", color: INK, fontWeight: 700 }}>
							{order.client?.email || "—"}
						</b>
					</div>
				</div>
			</div>

			{/* ===== ALLOCATION BANNER (חשבונית ישראל) ===== */}
			{alloc && (
				<div
					style={{
						display: "flex",
						gap: "12px",
						alignItems: "center",
						padding: "11px 32px",
						fontSize: "13px",
						lineHeight: 1.5,
						background: "#e8f4ea",
						borderBottom: "1px solid #b6d8c1",
						color: "#1b5e34",
					}}
				>
					<span style={{ fontSize: "18px" }}>🛡</span>
					<div>
						<b style={{ display: "block", fontWeight: 800, fontSize: "13.5px" }}>
							חשבונית מאושרת — "חשבונית ישראל"
						</b>
						<span style={{ display: "block", fontSize: "11.5px", color: "#3a6b4a" }}>
							מספר הקצאה: <b style={{ fontSize: "14px", letterSpacing: "1px" }}>{alloc}</b>
							{allocDate ? ` · ${formatDate(allocDate)}` : ""}
						</span>
					</div>
				</div>
			)}

			{/* ===== ITEMS ===== */}
			<div style={{ padding: "20px 32px 8px", background: "#fff" }}>
				<table
					style={{
						width: "100%",
						borderCollapse: "collapse",
						fontSize: "12.5px",
						border: `1px solid ${LINE}`,
					}}
				>
					<thead>
						<tr style={{ background: INK, color: "#fff", textAlign: "right" }}>
							<th style={th("center", 38)}>#</th>
							<th style={th("right", 110)}>מק"ט</th>
							<th style={th("right")}>פרטי המוצר</th>
							<th style={th("center", 70)}>כמות</th>
							<th style={th("left", 110)}>מחיר ליחידה</th>
							<th style={th("left", 110)}>סה"כ</th>
						</tr>
					</thead>
					<tbody>
						{order.cart.items.map((item, index) => {
							const name = item.product.name?.[0]?.value || "מוצר";
							const sku = (item.product as { sku?: string }).sku || "—";
							const unitPrice = item.product.price;
							return (
								<tr key={index} style={{ background: index % 2 ? "#fafaf6" : "#fff" }}>
									<td style={{ ...td, textAlign: "center", fontFamily: "monospace", color: "#807a6e" }}>
										{index + 1}
									</td>
									<td style={{ ...td, fontFamily: "monospace", fontSize: "11px", color: "#6b675f" }}>
										{sku}
									</td>
									<td style={{ ...td }}>
										<b style={{ fontSize: "13px", color: INK }}>{name}</b>
									</td>
									<td style={{ ...td, textAlign: "center", fontWeight: 800 }}>{item.amount}</td>
									<td style={{ ...td, textAlign: "left", color: "#3a3630", fontWeight: 600 }}>
										{formatCurrency(unitPrice)}
									</td>
									<td style={{ ...td, textAlign: "left", fontWeight: 800, background: PAPER }}>
										{formatCurrency(unitPrice * item.amount)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* ===== TOTALS ===== */}
			<div style={{ display: "flex", justifyContent: "flex-start", padding: "8px 32px 24px" }}>
				<div style={{ minWidth: "340px", background: "#fff", border: `1.5px solid ${INK}` }}>
					{subtotal > 0 && (
						<div style={totRow}>
							<span style={totSpan}>סכום ביניים (לפני מע"מ)</span>
							<b style={totBold}>{formatCurrency(subtotal)}</b>
						</div>
					)}
					{vatAmount > 0 && (
						<div style={totRow}>
							<span style={totSpan}>מע"מ ({vatPct}%)</span>
							<b style={totBold}>{formatCurrency(vatAmount)}</b>
						</div>
					)}
					{deliveryPrice > 0 && (
						<div style={totRow}>
							<span style={totSpan}>דמי משלוח</span>
							<b style={totBold}>{formatCurrency(deliveryPrice)}</b>
						</div>
					)}
					{discount > 0 && (
						<div style={{ ...totRow, background: "#f0f9f3", color: "#0f4a25" }}>
							<span style={{ color: "#0f4a25" }}>הנחה</span>
							<b style={{ color: "#0f4a25", fontWeight: 800 }}>-{formatCurrency(discount)}</b>
						</div>
					)}
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							background: INK,
							color: "#fff",
							padding: "14px 16px",
							fontSize: "17px",
							fontWeight: 900,
						}}
					>
						<span>סה"כ לתשלום</span>
						<span style={{ color: ORANGE, fontSize: "20px" }}>{formatCurrency(grandTotal)}</span>
					</div>
					{balance > 0.001 && (
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								background: "#fff3e0",
								color: "#7a4a00",
								padding: "10px 16px",
								fontSize: "13.5px",
								fontWeight: 800,
								borderTop: `1px solid ${LINE}`,
							}}
						>
							<span>יתרה לתשלום</span>
							<b style={{ color: "#7a4a00" }}>{formatCurrency(balance)}</b>
						</div>
					)}
				</div>
			</div>

			{/* ===== NOTES ===== */}
			{order.clientComment && (
				<div style={{ padding: "0 32px 18px" }}>
					<div
						style={{
							background: PAPER,
							border: `1px solid ${LINE}`,
							borderRadius: "6px",
							padding: "12px 14px",
							fontSize: "12.5px",
						}}
					>
						<b>הערות:</b> {order.clientComment}
					</div>
				</div>
			)}

			{/* ===== FOOTER ===== */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					borderTop: `1px solid ${LINE}`,
					padding: "10px 32px",
					fontSize: "10.5px",
					color: "#807a6e",
				}}
			>
				<span>
					{store.name}
					{store.companyNumber ? ` · ח.פ ${store.companyNumber}` : ""}
				</span>
				<span>
					חשבונית מס {invoiceNum}
					{alloc ? ` · מס׳ הקצאה ${alloc}` : ""}
				</span>
			</div>
		</div>
	);
}
