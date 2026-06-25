import { useState, ReactNode, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@heroui/react";
import { TOrder } from "@jsdev_ninja/core";
import { isOrderFinal } from "src/domains/Order";
import { Button } from "src/components/button";
import { DateView } from "src/components/DateView";
import { formatter } from "src/utils/formatter";
import { modalApi } from "src/infra/modals";
import { useAppApi } from "src/appApi";
import { FirebaseApi } from "src/lib/firebase";

/* Demo design tokens (balasi-all admin.css): pill variants. */
type PillVariant = "success" | "warn" | "info" | "danger" | "pending" | "neutral";
const pillStyles: Record<PillVariant, string> = {
	success: "bg-[#e3f2e8] text-[#155f30]",
	warn: "bg-[#fff6d9] text-[#9a7600]",
	info: "bg-[#e3eef9] text-[#1e5ba8]",
	danger: "bg-[#fbe3e0] text-[#c43f2e]",
	pending: "bg-[#fdebe0] text-[#d16a35]",
	neutral: "bg-[#eeece4] text-[#6b675f]",
};
function Pill({ variant = "neutral", children }: { variant?: PillVariant; children: ReactNode }) {
	return (
		<span
			className={`inline-block rounded px-2.5 py-[3px] text-[11px] font-bold tracking-[0.04em] ${pillStyles[variant]}`}
		>
			{children}
		</span>
	);
}

/* Item-status pills carry a 1px border in the demo (viewOrder line-item tags). */
const itemPillStyles = {
	missing: "bg-[#fdebe0] text-[#a14a2c] border border-[#d97757]",
	replaced: "bg-[#fff7e0] text-[#7a5a15] border border-[#d4a217]",
	deliveredInstead: "bg-[#e3f2e8] text-[#155f30] border border-[#1b7a3d]",
} as const;
// Payment statuses that mean the order is financially secured and safe to approve.
// An order that is still "pending" payment (unpaid or failed) must not be approvable.
const APPROVABLE_PAYMENT_STATUSES: string[] = ["pending_j5", "completed", "external"];

function ItemPill({
	variant,
	children,
}: {
	variant: keyof typeof itemPillStyles;
	children: ReactNode;
}) {
	return (
		<span
			className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ms-1.5 ${itemPillStyles[variant]}`}
		>
			{children}
		</span>
	);
}

/* Demo footer button styles (admin.css .btn / .btn-ghost / .btn-primary / .btn-danger). */
const btnBase =
	"gap-2 px-4 py-[9px] text-[12.5px] font-semibold tracking-[0.02em] border-[1.5px] rounded-lg transition";
const btnGhost = `${btnBase} bg-white text-[#1a1a17] border-[#e0dccd] hover:border-[#1a1a17] hover:bg-[#eeece4]`;
const btnPrimary = `${btnBase} bg-[#1b7a3d] text-white border-transparent hover:bg-[#155f30]`;
const btnDanger = `${btnBase} bg-white text-[#c43f2e] border-[#fbe3e0] hover:bg-[#fbe3e0] hover:border-[#c43f2e]`;

/* Order status → pill variant + emoji, mirroring demo orderStatusPill(). */
const statusPill: Record<TOrder["status"], { variant: PillVariant; emoji: string }> = {
	draft: { variant: "neutral", emoji: "" },
	pending: { variant: "warn", emoji: "⏳" },
	processing: { variant: "info", emoji: "✓" },
	in_delivery: { variant: "info", emoji: "🚚" },
	delivered: { variant: "success", emoji: "✓" },
	completed: { variant: "success", emoji: "✓" },
	cancelled: { variant: "danger", emoji: "✖" },
	refunded: { variant: "danger", emoji: "" },
};

/* cm-info banner — gradient card with a 3px start-border accent. */
function InfoBanner({
	icon,
	accent,
	gradient,
	children,
}: {
	icon: string;
	accent: string;
	gradient: string;
	children: ReactNode;
}) {
	return (
		<div
			className="flex items-start gap-3 px-[18px] py-3.5 border-r-[3px]"
			style={{ background: gradient, borderRightColor: accent }}
		>
			<span className="text-[22px] leading-none shrink-0">{icon}</span>
			<div className="flex-1 text-[12.5px] leading-[1.55] text-start">{children}</div>
		</div>
	);
}

function Field({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="text-sm text-start">
			<span className="font-bold text-gray-700">{label}: </span>
			<span className="text-gray-800">{children}</span>
		</div>
	);
}

/**
 * Order details popup — UI/UX modeled on the balasi-all "new design" viewOrder.
 * Body mirrors the demo (info grid, status pills, items table w/ manufacturer,
 * total, notes + delivery-note/invoice banners). Actions stay wired to the
 * existing appApi.admin order flow.
 */
export function OrderDetailsModal({
	order: initialOrder,
	onUpdated,
}: {
	order: TOrder;
	onUpdated?: (order: TOrder) => void;
}) {
	const { t } = useTranslation(["common", "ordersPage"]);
	const appApi = useAppApi();
	const [order, setOrder] = useState<TOrder>(initialOrder);
	const [loading, setLoading] = useState(false);
	const [linkLoading, setLinkLoading] = useState(false);
	const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | null>(null);
	const [paymentLinkError, setPaymentLinkError] = useState("");

	const close = () => modalApi.closeModal("orderDetails");

	// Apply an updated order to both this popup and the list row.
	function applyUpdate(updated: TOrder) {
		setOrder(updated);
		onUpdated?.(updated);
	}

	async function run(
		fn: () => Promise<unknown> | undefined,
		nextStatus: TOrder["status"],
	) {
		setLoading(true);
		try {
			const res = (await fn()) as { success?: boolean } | undefined;
			if (res?.success) applyUpdate({ ...order, status: nextStatus });
		} finally {
			setLoading(false);
		}
	}

	// Draft order = a J5 order whose payment never completed. Generate a HYP
	// payment link the admin can send the customer to finish paying.
	async function handleCreatePaymentLink() {
		setPaymentLinkError("");
		setLinkLoading(true);
		try {
			const res = await FirebaseApi.api.createPaymentRedirect({
				order,
				isJ5: false,
				origin: window.location.origin,
			});
			if (res.data?.success && res.data?.url) {
				setPaymentLinkUrl(res.data.url);
			} else {
				setPaymentLinkError(
					t("ordersPage:paymentLink.error", "שגיאה ביצירת לינק לתשלום"),
				);
			}
		} finally {
			setLinkLoading(false);
		}
	}

	function actions() {
		const els: JSX.Element[] = [];
		// New flow: a pending order is approved in one step → completed.
		// For "external" the onOrderUpdate trigger creates the delivery note;
		// for "j5" approveOrder charges the J5 hold first. (See approveOrder.)
		// Picking — fulfillment metadata, not a financial action. Allowed
		// for any non-final order; the payment guard lives on Approve.
		if (!isOrderFinal(order.status)) {
			els.push(
				<Button
					key="picking"
					variant="ghost"
					className={btnGhost}
					isPending={loading}
					onPress={() =>
						modalApi.openModal("orderPicking", {
							order,
							onSaved: (updated) => applyUpdate(updated),
						})
					}
				>
					{t("ordersPage:actions.picking", "📦 מצב ליקוט")}
				</Button>,
			);
		}
		// Edit — for "pending" AND "draft" ("לא הושלם") orders. A draft is an order
		// whose payment never completed (e.g. the customer's cart was lost before
		// paying). Exposing the edit button here lets the admin recover/fix such a
		// stuck order instead of only being able to cancel it.
		if (order.status === "pending" || order.status === "draft") {
			els.push(
				<Button
					key="edit"
					variant="ghost"
					className={btnGhost}
					isPending={loading}
					onPress={() =>
						modalApi.openModal("orderEdit", {
							order,
							onSaved: (updated) => applyUpdate(updated),
						})
					}
				>
					{t("ordersPage:actions.editOrder", "✏️ ערוך הזמנה")}
				</Button>,
			);
		}
		// Approve — only for a pending order whose payment is secured
		// (J5 hold authorized, already completed, or external terms). An unpaid or
		// failed "pending" order must not be approvable.
		if (order.status === "pending" && APPROVABLE_PAYMENT_STATUSES.includes(order.paymentStatus ?? "")) {
			els.push(
				<Button
					key="approve"
					variant="primary"
					className={btnPrimary}
					isPending={loading}
					onPress={() => run(() => appApi.admin.approveOrder({ order }), "completed")}
				>
					{t("ordersPage:actions.approveOrder", "✓ אשר → תעודת משלוח")}
				</Button>,
			);
		}
		// Create payment link — admin sends the customer a link to finish paying.
		// TEMPORARY (by request): render this button ALWAYS. Original condition was
		// `order.paymentType === "j5" && order.paymentStatus === "pending"` — restore to revert.
		if (true) {
			els.push(
				<Button
					key="createPaymentLink"
					variant="primary"
					className={btnPrimary}
					isPending={linkLoading}
					onPress={handleCreatePaymentLink}
				>
					{t("ordersPage:actions.createPaymentLink", "🔗 צור לינק לתשלום")}
				</Button>,
			);
		}
		// TEMPORARY "charge older order" button — hidden from the UI by request.
		// Logic is intentionally KEPT (`appApi.admin.chargeOrder` + backend `chargeOrder`
		// remain untouched). Re-enable by un-commenting the block below.
		// if (order.paymentStatus === "pending_j5") {
		// 	els.push(
		// 		<Button
		// 			key="chargeOrder"
		// 			variant="primary"
		// 			className={btnPrimary}
		// 			isPending={loading}
		// 			onPress={async () => {
		// 				setLoading(true);
		// 				try {
		// 					const res = await appApi.admin.chargeOrder({ order });
		// 					if (!res?.success) return;
		// 					// Backend chargeOrder does NOT directly write paymentStatus —
		// 					// the onTransactionPostedMarkOrderPaid subscriber flips it to
		// 					// "completed" asynchronously. Refetch to pick that up.
		// 					const fresh = await appApi.admin.getOrder(order.id);
		// 					if (fresh?.success && fresh.data) applyUpdate(fresh.data);
		// 				} finally {
		// 					setLoading(false);
		// 				}
		// 			}}
		// 		>
		// 			{t("ordersPage:actions.chargeOrder")}
		// 		</Button>,
		// 	);
		// }
		if (order.status !== "cancelled" && order.status !== "completed") {
			els.push(
				<Button
					key="cancel"
					variant="danger"
					className={btnDanger}
					isPending={loading}
					onPress={() => run(() => appApi.admin.cancelOrder({ order }), "cancelled")}
				>
					{t("ordersPage:actions.cancelOrder")}
				</Button>,
			);
		}
		return els;
	}

	const items = order.cart.items ?? [];
	const deliveryNoteNumber =
		(order as { deliveryNote?: { number?: string } }).deliveryNote?.number;
	const invoiceNumber =
		(order as { ezInvoice?: { doc_number?: string }; invoice?: { doc_number?: string } })
			.ezInvoice?.doc_number ??
		(order as { invoice?: { doc_number?: string } }).invoice?.doc_number;

	return (
		<Modal.Backdrop
			isOpen
			onOpenChange={(open) => {
				if (!open) close();
			}}
		>
			<Modal.Container size="lg" scroll="inside" placement="center">
				<Modal.Dialog className="max-h-[85vh] w-full max-w-3xl flex flex-col p-0 overflow-hidden">
					{/* Demo modal chrome: black header bar + circular close (admin.css .m-head) */}
					<Modal.Header className="relative !flex-row items-center bg-[#1a1a17] px-6 py-[18px] m-0">
						<Modal.Heading className="flex-1 min-w-0 truncate pe-12 text-[16px] font-extrabold tracking-[-0.02em] text-white text-start">
							{t("ordersPage:orderDetails.title", "הזמנה")} #{order.id}
						</Modal.Heading>
						<Modal.CloseTrigger className="absolute !left-6 !right-auto !start-auto top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:rotate-90 hover:bg-white/20">
							✕
						</Modal.CloseTrigger>
					</Modal.Header>
					<Modal.Body className="space-y-4 flex-1 min-h-0 overflow-y-auto px-6 py-5">
						{/* Info grid */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
							<Field label={t("ordersPage:orderDetails.company", "חברה")}>
								{order.client?.companyName || "—"}
							</Field>
							<Field label={t("ordersPage:orderDetails.contact", "איש קשר")}>
								{order.client?.displayName || "—"}
							</Field>
							<Field label={t("ordersPage:columns.date", "תאריך")}>
								<DateView date={order.date} />
							</Field>
							<Field label={t("ordersPage:orderDetails.paymentMethod", "אופן תשלום")}>
								{order.paymentType || "—"}
							</Field>
							<Field label={t("ordersPage:orderDetails.billingAccount", "חשבון לחיוב")}>
								{order.billingAccount
									? `${order.billingAccount.name ?? ""} (${order.billingAccount.number ?? ""})`
									: "—"}
							</Field>
							{order.address && (
								<div className="sm:col-span-2">
									<Field label={t("ordersPage:orderDetails.delivery.address", "כתובת למשלוח")}>
										{[
											[order.address.street, order.address.streetNumber]
												.filter(Boolean)
												.join(" "),
											order.address.city,
											order.address.floor
												? `${t("ordersPage:orderDetails.delivery.floor", "קומה")} ${order.address.floor}`
												: "",
											order.address.apartmentNumber
												? `${t("ordersPage:orderDetails.delivery.apartment", "דירה")} ${order.address.apartmentNumber}`
												: "",
										]
											.filter(Boolean)
											.join(", ") || "—"}
									</Field>
								</div>
							)}
							<div className="text-sm text-start flex items-center gap-1.5 flex-wrap">
								<span className="font-bold text-gray-700">
									{t("ordersPage:orderDetails.orderInfo.status", "סטטוס")}:
								</span>
								<Pill variant={statusPill[order.status].variant}>
									{statusPill[order.status].emoji
										? `${statusPill[order.status].emoji} `
										: ""}
									{t(`common:orderStatutes.${order.status}`, order.status)}
								</Pill>
								<Pill variant="neutral">{order.paymentStatus}</Pill>
							</div>
						</div>

						{/* Pending → approval explainer */}
						{order.status === "pending" && (
							<InfoBanner
								icon="📦"
								accent="#d4a217"
								gradient="linear-gradient(135deg,#fff6d9,#fff)"
							>
								{t("ordersPage:orderDetails.pendingExplain.before", "באישור ההזמנה תיווצר ")}
								<b>{t("ordersPage:orderDetails.deliveryNote", "תעודת משלוח")}</b>
								{t(
									"ordersPage:orderDetails.pendingExplain.after",
									". חשבונית מס תופק בנפרד — ידנית מהתעודה או דרך החיוב החודשי המרוכז.",
								)}
							</InfoBanner>
						)}

						{/* Fulfillment summary (after picking) */}
						{items.some((i) => i.status === "missing" || i.status === "substituted") && (
							<InfoBanner icon="📦" accent="#d4a217" gradient="linear-gradient(135deg,#fff7e0,#fdebe0)">
								<b>{t("ordersPage:orderDetails.fulfillment", "שינויים שהוגדרו בליקוט")}:</b>{" "}
								{items.filter((i) => i.status === "missing").length > 0 &&
									`${items.filter((i) => i.status === "missing").length} פריטים חסרים במלאי (לא ייכללו במשלוח). `}
								{items.filter((i) => i.status === "substituted").length > 0 &&
									`${items.filter((i) => i.status === "substituted").length} פריטים יוחלפו במוצרים דומים.`}
								<br />
								<span className="text-xs text-gray-500">
									{t(
										"ordersPage:orderDetails.fulfillmentSub",
										"בעת אישור ההזמנה, תעודת המשלוח תופק עם השינויים האלה.",
									)}
								</span>
							</InfoBanner>
						)}

						{/* Items table — demo .table styling (admin.css) */}
						<table className="w-full border-collapse text-[13.5px]">
							<thead>
								<tr className="bg-[#eeece4]">
									<th className="text-start font-bold text-[12px] uppercase tracking-[0.04em] text-[#1a1a17] px-4 py-3 border-b border-[#e0dccd]">
										{t("ordersPage:orderDetails.products.product", "מוצר")}
									</th>
									<th className="text-start font-bold text-[12px] uppercase tracking-[0.04em] text-[#1a1a17] px-4 py-3 border-b border-[#e0dccd]">
										{t("ordersPage:orderDetails.products.manufacturer", "יצרן")}
									</th>
									<th className="text-center font-bold text-[12px] uppercase tracking-[0.04em] text-[#1a1a17] px-4 py-3 border-b border-[#e0dccd]">
										{t("ordersPage:orderDetails.products.qty", "כמות")}
									</th>
									<th className="text-end font-bold text-[12px] uppercase tracking-[0.04em] text-[#1a1a17] px-4 py-3 border-b border-[#e0dccd]">
										{t("ordersPage:orderDetails.products.price", "מחיר")}
									</th>
									<th className="text-end font-bold text-[12px] uppercase tracking-[0.04em] text-[#1a1a17] px-4 py-3 border-b border-[#e0dccd]">
										{t("ordersPage:columns.sum", 'סה"כ')}
									</th>
								</tr>
							</thead>
							<tbody>
								{items.map((item, i) => {
									const unit = item.finalPrice || item.originalPrice || 0;
									const name = item.product.name?.[0]?.value || t("common:emptyField");
									const struck = "line-through text-[#999]";
									const td = "px-4 py-3 border-b border-[#eee9d8] align-middle";

									if (item.status === "missing") {
										return (
											<tr key={item.product.id || i} className="bg-[#fef8f5]">
												<td className={`${td} text-start`}>
													<span className={struck}>{name}</span>
													<ItemPill variant="missing">
														❌ {t("ordersPage:orderDetails.missing", "חסר במלאי")}
													</ItemPill>
												</td>
												<td className={`${td} text-start ${struck} text-[12.5px]`}>
													{item.product.brand || "—"}
												</td>
												<td className={`${td} text-center ${struck}`}>{formatter.qty(item.amount)}</td>
												<td className={`${td} text-end ${struck}`}>{formatter.price(unit)}</td>
												<td className={`${td} text-end ${struck} text-[12.5px]`}>
													{formatter.price(unit * item.amount)}
												</td>
											</tr>
										);
									}

									if (item.status === "substituted" && item.substitutedWith) {
										const sub = item.substitutedWith;
										return (
											<Fragment key={item.product.id || i}>
												<tr className="bg-[#fffbef]">
													<td className={`${td} text-start`}>
														<span className={struck}>{name}</span>
														<ItemPill variant="replaced">
															🔄 {t("ordersPage:orderDetails.replaced", "הוחלף")}
														</ItemPill>
													</td>
													<td className={`${td} text-start ${struck} text-[12.5px]`}>
														{item.product.brand || "—"}
													</td>
													<td className={`${td} text-center ${struck}`}>{formatter.qty(item.amount)}</td>
													<td className={`${td} text-end ${struck}`}>{formatter.price(unit)}</td>
													<td className={`${td} text-end ${struck} text-[12.5px]`}>
														{formatter.price(unit * item.amount)}
													</td>
												</tr>
												<tr className="bg-[#f3f8f4]">
													<td className={`${td} text-start`}>
														↳ {sub.product.name?.[0]?.value}
														<ItemPill variant="deliveredInstead">
															✓ {t("ordersPage:orderDetails.deliveredInstead", "נמסר במקום")}
														</ItemPill>
													</td>
													<td className={`${td} text-start text-[#6b675f] text-[12.5px]`}>
														{sub.product.brand || "—"}
													</td>
													<td className={`${td} text-center`}>{formatter.qty(sub.amount)}</td>
													<td className={`${td} text-end text-[#6b675f]`}>{formatter.price(sub.price)}</td>
													<td className={`${td} text-end font-bold text-[#1a1a17]`}>
														{formatter.price(sub.price * sub.amount)}
													</td>
												</tr>
											</Fragment>
										);
									}

									return (
										<tr key={item.product.id || i} className="last:[&>td]:border-0">
											<td className={`${td} text-start`}>{name}</td>
											<td className={`${td} text-start text-[#6b675f] text-[12.5px]`}>
												{item.product.brand || "—"}
											</td>
											<td className={`${td} text-center`}>{formatter.qty(item.amount)}</td>
											<td className={`${td} text-end text-[#6b675f]`}>{formatter.price(unit)}</td>
											<td className={`${td} text-end font-bold text-[#1a1a17]`}>
												{formatter.price(unit * item.amount)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>

						{/* Totals breakdown — items subtotal + VAT + delivery + grand total.
						    cart.cartTotal already includes VAT + delivery (see getCartCost in core),
						    so itemsSubtotal is back-derived for display. */}
						<div className="mt-3.5 text-start space-y-0.5">
							{(() => {
								const total = order.cart.cartTotal ?? 0;
								const vat = order.cart.cartVat ?? 0;
								const delivery = order.cart.deliveryPrice ?? 0;
								const itemsSubtotal = Number((total - vat - delivery).toFixed(2));
								const hasBreakdown = vat > 0 || delivery > 0;
								return (
									<>
										{hasBreakdown && (
											<>
												<div className="text-[14px] text-[#1a1a17]">
													{t("ordersPage:orderDetails.totals.items", "פריטים")}: {formatter.price(itemsSubtotal)}
												</div>
												{vat > 0 && (
													<div className="text-[14px] text-[#1a1a17]">
														{t("ordersPage:orderDetails.totals.vat", 'מע"מ')}: {formatter.price(vat)}
													</div>
												)}
												{delivery > 0 && (
													<div className="text-[14px] text-[#1a1a17]">
														{t("ordersPage:orderDetails.totals.delivery", "משלוח")}: {formatter.price(delivery)}
													</div>
												)}
											</>
										)}
										<div className="text-[18px] font-black text-[#1a1a17] pt-1">
											{t("ordersPage:columns.sum", 'סה"כ')}: {formatter.price(total)}
										</div>
									</>
								);
							})()}
						</div>

						{order.clientComment && (
							<div className="bg-[#fff6d9] p-2.5 text-[13px] text-start">
								<b>{t("ordersPage:orderDetails.notes.title", "הערות")}:</b> {order.clientComment}
							</div>
						)}

						{deliveryNoteNumber && (
							<div className="bg-[#e3f2e8] p-2.5 text-[13px] text-start">
								<b>📦 {t("ordersPage:orderDetails.deliveryNoteCreated", "תעודת משלוח שנוצרה")}:</b>{" "}
								{deliveryNoteNumber}
							</div>
						)}
						{invoiceNumber && (
							<div className="bg-[#e3eef9] p-2.5 text-[13px] text-start">
								<b>🧾 {t("ordersPage:orderDetails.invoiceCreated", "חשבונית שנוצרה")}:</b>{" "}
								{invoiceNumber}
							</div>
						)}
						{paymentLinkUrl && (
							<div className="bg-[#e3f2e8] p-3 text-[13px] text-start space-y-2">
								<b>🔗 {t("ordersPage:paymentLink.created", "לינק לתשלום נוצר")}:</b>
								<div className="text-[12px] text-[#1a1a17]">
									{t("ordersPage:paymentLink.amount", "סכום החיוב")}: <b>{formatter.price(order.cart.cartTotal)}</b>
									{(order.cart.deliveryPrice ?? 0) > 0 && (
										<>
											{" "}
											<span className="text-[#5a5a55]">
												({t("ordersPage:paymentLink.includesDelivery", "כולל משלוח")} {formatter.price(order.cart.deliveryPrice ?? 0)})
											</span>
										</>
									)}
								</div>
								<div className="flex items-center gap-2">
									<input
										readOnly
										value={paymentLinkUrl}
										onFocus={(e) => e.target.select()}
										className="flex-1 rounded border border-[#cfe6d6] bg-white px-2 py-1 text-[12px]"
									/>
									<Button
										variant="ghost"
										className={btnGhost}
										onPress={() => navigator.clipboard?.writeText(paymentLinkUrl)}
									>
										{t("common:copy", "העתק")}
									</Button>
								</div>
							</div>
						)}
						{paymentLinkError && (
							<div className="bg-[#fbe3e0] p-2.5 text-[13px] text-start text-[#c43f2e]">
								{paymentLinkError}
							</div>
						)}
					</Modal.Body>
					<Modal.Footer className="flex flex-wrap justify-end gap-2 bg-[#eeece4] border-t border-[#e0dccd] px-6 py-3.5 m-0">
						<Button variant="ghost" className={btnGhost} onPress={close}>
							{t("common:close", "סגור")}
						</Button>
						{actions()}
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
