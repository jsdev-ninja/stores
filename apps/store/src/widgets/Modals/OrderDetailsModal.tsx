import { useState, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@heroui/react";
import { TOrder } from "@jsdev_ninja/core";
import { Button } from "src/components/button";
import { DateView } from "src/components/DateView";
import { formatter } from "src/utils/formatter";
import { modalApi } from "src/infra/modals";
import { useAppApi } from "src/appApi";

/* Demo design tokens (balasi-all): pill variants. */
type PillVariant = "success" | "warn" | "info" | "danger" | "pending" | "neutral";
const pillStyles: Record<PillVariant, string> = {
	success: "bg-[#e3f2e8] text-[#155f30]",
	warn: "bg-[#fff6d9] text-[#9a7600]",
	info: "bg-[#e3eef9] text-[#1e5ba8]",
	danger: "bg-[#fdebe0] text-[#a14a2c]",
	pending: "bg-[#fdebe0] text-[#d16a35]",
	neutral: "bg-gray-100 text-gray-500",
};
function Pill({ variant = "neutral", children }: { variant?: PillVariant; children: ReactNode }) {
	return (
		<span
			className={`inline-flex items-center rounded px-2 py-0.5 text-[11.5px] font-semibold tracking-wide ${pillStyles[variant]}`}
		>
			{children}
		</span>
	);
}

const statusPillVariant: Record<TOrder["status"], PillVariant> = {
	draft: "neutral",
	pending: "pending",
	processing: "info",
	in_delivery: "info",
	delivered: "success",
	completed: "success",
	cancelled: "danger",
	refunded: "danger",
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
			className="flex items-start gap-3 rounded-md p-3.5 border-r-[3px]"
			style={{ background: gradient, borderRightColor: accent }}
		>
			<span className="text-lg leading-none">{icon}</span>
			<div className="flex-1 text-sm leading-relaxed text-start">{children}</div>
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
	onUpdated?: (id: string, status: TOrder["status"]) => void;
}) {
	const { t } = useTranslation(["common", "ordersPage"]);
	const appApi = useAppApi();
	const [order, setOrder] = useState<TOrder>(initialOrder);
	const [loading, setLoading] = useState(false);

	const close = () => modalApi.closeModal("orderDetails");

	async function run(
		fn: () => Promise<unknown> | undefined,
		nextStatus: TOrder["status"],
	) {
		setLoading(true);
		try {
			const res = (await fn()) as { success?: boolean } | undefined;
			if (res?.success) {
				setOrder((o) => ({ ...o, status: nextStatus }));
				onUpdated?.(order.id, nextStatus);
			}
		} finally {
			setLoading(false);
		}
	}

	function actions() {
		const els: JSX.Element[] = [];
		// New flow: a pending order is approved in one step → completed.
		// For "external" the onOrderUpdate trigger creates the delivery note;
		// for "j5" approveOrder charges the J5 hold first. (See approveOrder.)
		if (order.status === "pending") {
			els.push(
				<Button
					key="picking"
					variant="ghost"
					isPending={loading}
					onPress={() =>
						modalApi.openModal("orderPicking", {
							order,
							onSaved: () => close(),
						})
					}
				>
					{t("ordersPage:actions.picking", "📦 מצב ליקוט")}
				</Button>,
			);
			els.push(
				<Button
					key="approve"
					variant="primary"
					isPending={loading}
					onPress={() => run(() => appApi.admin.approveOrder({ order }), "completed")}
				>
					{t("ordersPage:actions.approveOrder", "אשר")}
				</Button>,
			);
		}
		if (order.status !== "cancelled" && order.status !== "completed") {
			els.push(
				<Button
					key="cancel"
					variant="danger"
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
			<Modal.Container size="lg" scroll="inside">
				<Modal.Dialog>
					<Modal.Header>
						<Modal.Heading>
							<div className="text-start">
								{t("ordersPage:orderDetails.title", "הזמנה")} #{order.id.slice(-8)}
							</div>
						</Modal.Heading>
					</Modal.Header>
					<Modal.Body className="space-y-4">
						{/* Info grid */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
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
							<div className="text-sm text-start flex items-center gap-2 flex-wrap">
								<span className="font-bold text-gray-700">
									{t("ordersPage:orderDetails.orderInfo.status", "סטטוס")}:
								</span>
								<Pill variant={statusPillVariant[order.status]}>
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
								{t(
									"ordersPage:orderDetails.pendingExplain",
									'באישור ההזמנה תיווצר תעודת משלוח. חשבונית מס תופק בנפרד.',
								)}
							</InfoBanner>
						)}

						{/* Items table */}
						<table className="w-full border-collapse text-sm">
							<thead>
								<tr className="text-[11px] uppercase tracking-wide text-gray-500 border-b border-gray-200">
									<th className="text-start font-medium py-2">
										{t("ordersPage:orderDetails.products.product", "מוצר")}
									</th>
									<th className="text-start font-medium py-2">
										{t("ordersPage:orderDetails.products.manufacturer", "יצרן")}
									</th>
									<th className="text-center font-medium py-2">
										{t("ordersPage:orderDetails.products.qty", "כמות")}
									</th>
									<th className="text-end font-medium py-2">
										{t("ordersPage:orderDetails.products.price", "מחיר")}
									</th>
									<th className="text-end font-medium py-2">
										{t("ordersPage:columns.sum", 'סה"כ')}
									</th>
								</tr>
							</thead>
							<tbody>
								{items.map((item, i) => {
									const unit = item.finalPrice || item.originalPrice || 0;
									return (
										<tr
											key={item.product.id || i}
											className="border-b border-gray-100 last:border-0"
										>
											<td className="py-2 text-start">
												{item.product.name?.[0]?.value || t("common:emptyField")}
											</td>
											<td className="py-2 text-start text-gray-500">
												{item.product.brand || "—"}
											</td>
											<td className="py-2 text-center">{item.amount}</td>
											<td className="py-2 text-end text-gray-500">{formatter.price(unit)}</td>
											<td className="py-2 text-end font-semibold text-gray-900">
												{formatter.price(unit * item.amount)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>

						<div className="text-start text-lg font-black">
							{t("ordersPage:columns.sum", 'סה"כ')}: {formatter.price(order.cart.cartTotal)}
						</div>

						{order.clientComment && (
							<div className="rounded-md bg-[#fff6d9] p-2.5 text-sm text-start">
								<b>{t("ordersPage:orderDetails.notes", "הערות")}:</b> {order.clientComment}
							</div>
						)}

						{deliveryNoteNumber && (
							<div className="rounded-md bg-[#e3f2e8] p-2.5 text-sm text-start">
								<b>📦 {t("ordersPage:orderDetails.deliveryNoteCreated", "תעודת משלוח שנוצרה")}:</b>{" "}
								{deliveryNoteNumber}
							</div>
						)}
						{invoiceNumber && (
							<div className="rounded-md bg-[#e3eef9] p-2.5 text-sm text-start">
								<b>🧾 {t("ordersPage:orderDetails.invoiceCreated", "חשבונית שנוצרה")}:</b>{" "}
								{invoiceNumber}
							</div>
						)}
					</Modal.Body>
					<Modal.Footer>
						<Button variant="ghost" onPress={close}>
							{t("common:close", "סגור")}
						</Button>
						{actions()}
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
