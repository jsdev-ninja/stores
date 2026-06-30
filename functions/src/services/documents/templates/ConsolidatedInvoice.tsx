import * as React from "react";
import { TOrder, TStore } from "@jsdev_ninja/core";

type ConsolidatedInvoiceProps = {
	orders: TOrder[];
	store: TStore;
	invoiceNumber?: string;
	invoiceDate?: string;
	/** חשבונית ישראל allocation number. Falls back to the value stored on the first order's invoice. */
	allocationNumber?: string;
	/** Epoch millis the allocation number was issued. */
	allocationDate?: number;
};

// Demo-matched palette (kept in sync with Invoice.tsx).
const GREEN_DARK = "#0d4f3a";
const GREEN = "#1b7a3d";
const INK = "#1a1a17";
const ORANGE = "#e8804a";
const PAPER = "#f8f6f0";
const LINE = "#e0dccd";

export function ConsolidatedInvoice({
	orders,
	store,
	invoiceNumber,
	invoiceDate,
	allocationNumber,
	allocationDate,
}: ConsolidatedInvoiceProps) {
	const formatDate = (timestamp: number) =>
		new Date(timestamp).toLocaleDateString("he-IL", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});

	const formatCurrency = (amount: number) =>
		new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(amount);

	// Orders that carry a delivery note (the consolidated invoice aggregates these).
	const ordersWithDeliveryNotes = orders.filter((order) => order.deliveryNote);

	// Preserve the existing VAT split logic: taxable base, exempt base and VAT.
	let totalTaxable = 0; // סה"כ חייב במע"מ
	let totalExempt = 0; // סה"כ פטור ממע"מ
	let totalVat = 0; // סה"כ מע"מ
	ordersWithDeliveryNotes.forEach((order) => {
		const cartTotal = order.cart.cartTotal || 0;
		const cartVat = order.cart.cartVat || 0;
		const subtotalPrice = cartTotal - cartVat;
		if (cartVat > 0) {
			totalTaxable += subtotalPrice;
			totalVat += cartVat;
		} else {
			totalExempt += cartTotal;
		}
	});
	const grandTotal = totalTaxable + totalVat + totalExempt;

	const invoiceNum = invoiceNumber || orders[0]?.invoice?.number;
	const invoiceDateStr = invoiceDate || formatDate(orders[0]?.date ?? 0);

	// Allocation number / date may be supplied as a prop or persisted on the first order's invoice.
	const invoiceAny = orders[0]?.invoice as unknown as
		| { allocationNumber?: string; allocationDate?: number }
		| undefined;
	const alloc = allocationNumber ?? invoiceAny?.allocationNumber;
	const allocDate = allocationDate ?? invoiceAny?.allocationDate;

	// Sender (store) address
	const sa = store.address;
	const storeAddress = sa
		? [sa.street && `${sa.street} ${sa.streetNumber || ""}`.trim(), sa.city]
				.filter(Boolean)
				.join(", ")
		: "";

	// Recipient (from the first order)
	const first = orders[0];
	const customerName = first?.nameOnInvoice || first?.client?.displayName || "—";
	const { apartmentNumber, city, floor, street, streetNumber } = first?.client?.address ?? {};
	const fullAddress = `${city || ""}${street ? `, ${street} ${streetNumber || ""}` : ""}${
		floor ? ` קומה ${floor}` : ""
	}${apartmentNumber ? `, דירה ${apartmentNumber}` : ""}`.trim();

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
						חשבונית מס מרוכזת
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
							<span style={{ opacity: 0.75 }}>מספר תעודות:</span>
							<b style={{ fontWeight: 700 }}>{ordersWithDeliveryNotes.length}</b>
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
						{first?.companyNumber && (
							<span style={{ fontSize: "12px", color: "#807a6e" }}>ח.פ {first.companyNumber}</span>
						)}
					</div>
					<div style={rCol}>
						<span style={rLabel}>כתובת אספקה</span>
						<b style={{ fontSize: "14px", color: INK, fontWeight: 700 }}>{fullAddress || "—"}</b>
					</div>
					<div style={rCol}>
						<span style={rLabel}>טלפון</span>
						<b style={{ fontSize: "14px", color: INK, fontWeight: 700 }}>
							{first?.client?.phoneNumber || "—"}
						</b>
					</div>
					<div style={rCol}>
						<span style={rLabel}>אימייל</span>
						<b style={{ fontSize: "14px", color: INK, fontWeight: 700 }}>
							{first?.client?.email || "—"}
						</b>
					</div>
				</div>
			</div>

			{/* ===== ALLOCATION BANNER ===== */}
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

			{/* ===== DELIVERY NOTES ===== */}
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
							<th style={th("right")}>מספר תעודת משלוח</th>
							<th style={th("center", 140)}>תאריך</th>
							<th style={th("left", 130)}>סה"כ</th>
							<th style={th("left", 120)}>מע"מ</th>
						</tr>
					</thead>
					<tbody>
						{ordersWithDeliveryNotes.map((order, index) => {
							const deliveryNote = order.deliveryNote!;
							const cartTotal = order.cart.cartTotal || 0;
							const cartVat = order.cart.cartVat || 0;
							const docNumber =
								"doc_number" in deliveryNote
									? (deliveryNote as { doc_number?: string }).doc_number
									: "number" in deliveryNote
									? (deliveryNote as { number?: string }).number
									: "";
							const deliveryDate =
								deliveryNote.date && typeof deliveryNote.date === "number"
									? deliveryNote.date
									: order.date;
							return (
								<tr key={index} style={{ background: index % 2 ? "#fafaf6" : "#fff" }}>
									<td style={{ ...td, fontWeight: 700 }}>{docNumber}</td>
									<td style={{ ...td, textAlign: "center", color: "#3a3630" }}>
										{formatDate(deliveryDate)}
									</td>
									<td style={{ ...td, textAlign: "left", fontWeight: 800, background: PAPER }}>
										{formatCurrency(cartTotal)}
									</td>
									<td style={{ ...td, textAlign: "left", color: "#3a3630" }}>
										{formatCurrency(cartVat)}
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
					{totalTaxable > 0 && (
						<div style={totRow}>
							<span style={totSpan}>סה"כ חייב במע"מ</span>
							<b style={totBold}>{formatCurrency(totalTaxable)}</b>
						</div>
					)}
					{totalExempt > 0 && (
						<div style={totRow}>
							<span style={totSpan}>סה"כ פטור ממע"מ</span>
							<b style={totBold}>{formatCurrency(totalExempt)}</b>
						</div>
					)}
					{totalVat > 0 && (
						<div style={totRow}>
							<span style={totSpan}>סה"כ מע"מ</span>
							<b style={totBold}>{formatCurrency(totalVat)}</b>
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
				</div>
			</div>

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
					חשבונית מס מרוכזת {invoiceNum}
					{alloc ? ` · מס׳ הקצאה ${alloc}` : ""}
				</span>
			</div>
		</div>
	);
}
