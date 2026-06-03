import { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { DateView } from "src/components/DateView";
import { Price } from "src/components/Price";
import { TOrder } from "src/domains/Order";
import { modalApi } from "src/infra/modals";
import {
	Table,
	Modal,
	Pagination,
	Input,
	Select,
	ListBox,
	Avatar,
	Button,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { TOrganization } from "@jsdev_ninja/core";

// Helper for Avatar fallback initials
function getInitials(name: string): string {
	return name
		.split(" ")
		.map((w) => w[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getColumns = (t: any) => [
	{ name: t("ordersPage:columns.orderId"), uid: "id" },
	{ name: t("ordersPage:columns.customerName", "Customer Name"), uid: "customerName" },
	{ name: t("ordersPage:columns.createdBy", "Created By"), uid: "createdBy" },
	{ name: t("ordersPage:columns.paymentType", "Payment Type"), uid: "paymentType" },
	{ name: t("ordersPage:columns.sum"), uid: "total" },
	{ name: t("ordersPage:columns.date"), uid: "date" },
	{ name: t("ordersPage:columns.status"), uid: "status" },
	{ name: t("ordersPage:columns.actions", "Actions"), uid: "actions" },
];

// Order-status → themed pill style. Blue (--info) marks "approved" (processing).
const STATUS_STYLE: Record<TOrder["status"], { color: string; icon: string }> = {
	draft: { color: "var(--muted)", icon: "lucide:file" },
	pending: { color: "var(--warning)", icon: "lucide:hourglass" },
	processing: { color: "var(--info)", icon: "lucide:check" },
	in_delivery: { color: "var(--info)", icon: "lucide:truck" },
	delivered: { color: "var(--accent)", icon: "lucide:package-check" },
	completed: { color: "var(--success)", icon: "lucide:circle-check" },
	cancelled: { color: "var(--danger)", icon: "lucide:x" },
	refunded: { color: "var(--danger)", icon: "lucide:rotate-ccw" },
};

const ALL_STATUSES: TOrder["status"][] = [
	"pending",
	"processing",
	"in_delivery",
	"delivered",
	"completed",
	"cancelled",
	"refunded",
	"draft",
];

// Tab grouping: Active = open, Completed = done, All = everything.
const ACTIVE_STATUSES: TOrder["status"][] = ["pending", "processing", "in_delivery", "draft"];
const COMPLETED_STATUSES: TOrder["status"][] = ["completed", "delivered"];

type TabKey = "active" | "completed" | "all";

function softBg(color: string, pct = 14) {
	return `color-mix(in oklab, ${color} ${pct}%, transparent)`;
}

function StatusPill({ status, label }: { status: TOrder["status"]; label: string }) {
	const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
	return (
		<span
			className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
			style={{ backgroundColor: softBg(s.color, 16), color: s.color }}
		>
			<Icon icon={s.icon} width={13} height={13} />
			{label}
		</span>
	);
}

function AdminOrdersPages() {
	const appApi = useAppApi();
	const { t, i18n } = useTranslation(["common", "ordersPage"]);
	const isRTL = i18n.dir() === "rtl";

	const [orders, setOrders] = useState<TOrder[]>([]);
	const [organizations, setOrganizations] = useState<TOrganization[]>([]);
	const [page, setPage] = useState(1);
	const rowsPerPage = 10;
	const [isCancelOpen, setIsCancelOpen] = useState(false);
	const [orderToCancel, setOrderToCancel] = useState<TOrder | null>(null);

	// Filters
	const [tab, setTab] = useState<TabKey>("active");
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	const headerColumns = useMemo(() => getColumns(t), [t]);

	useEffect(() => {
		appApi.admin.getStoreOrders().then((res) => {
			if (!res) return;
			setOrders(res.data);
		});
	}, []);

	useEffect(() => {
		appApi.admin.listOrganizations().then((res) => {
			if (res?.success) {
				setOrganizations(res.data || []);
			}
		});
	}, []);

	const getOrganizationName = useCallback(
		(organizationId?: string) => {
			if (!organizationId) return null;
			const org = organizations.find((o) => o.id === organizationId);
			return org?.name || null;
		},
		[organizations]
	);

	const counts = useMemo(
		() => ({
			active: orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
			completed: orders.filter((o) => COMPLETED_STATUSES.includes(o.status)).length,
			all: orders.length,
		}),
		[orders]
	);

	const filtered = useMemo(() => {
		let list = orders;
		if (tab === "active") list = list.filter((o) => ACTIVE_STATUSES.includes(o.status));
		else if (tab === "completed") list = list.filter((o) => COMPLETED_STATUSES.includes(o.status));

		if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);

		const q = search.trim().toLowerCase();
		if (q) {
			list = list.filter(
				(o) =>
					o.id.toLowerCase().includes(q) ||
					(o.client?.displayName ?? "").toLowerCase().includes(q) ||
					(getOrganizationName(o.organizationId) ?? "").toLowerCase().includes(q)
			);
		}
		return list;
	}, [orders, tab, statusFilter, search, getOrganizationName]);

	// Reset to first page whenever the filter set changes.
	useEffect(() => {
		setPage(1);
	}, [tab, statusFilter, search]);

	const pages = Math.ceil(filtered.length / rowsPerPage) || 1;
	const items = useMemo(() => {
		const start = (page - 1) * rowsPerPage;
		return filtered.slice(start, start + rowsPerPage);
	}, [page, filtered]);

	function updateOrder(id: string, status: TOrder["status"]) {
		setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)));
	}

	async function confirmCancelOrder() {
		if (!orderToCancel) return;
		const res = await appApi.admin.cancelOrder({ order: orderToCancel });
		if (!res?.success) {
			setIsCancelOpen(false);
			return;
		}
		updateOrder(orderToCancel.id, "cancelled");
		setIsCancelOpen(false);
		setOrderToCancel(null);
	}

	function syncOrders() {
		appApi.admin.getStoreOrders().then((res) => {
			if (res) setOrders(res.data);
		});
	}

	function exportOrders() {
		const header = [
			t("ordersPage:columns.orderId", "מס' הזמנה"),
			t("ordersPage:columns.customerName", "לקוח"),
			t("ordersPage:columns.date", "תאריך"),
			t("ordersPage:columns.sum", "סכום"),
			t("ordersPage:columns.status", "סטטוס"),
		];
		const rows = filtered.map((o) => [
			o.id,
			o.client?.displayName ?? "",
			new Date(o.date).toLocaleDateString("he-IL"),
			String(o.cart.cartTotal),
			t(`common:orderStatutes.${o.status}`, o.status),
		]);
		const csv = [header, ...rows]
			.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
			.join("\n");
		const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
		// eslint-disable-next-line compat/compat
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "orders.csv";
		a.click();
		// eslint-disable-next-line compat/compat
		URL.revokeObjectURL(url);
	}

	const renderCell = useCallback(
		(order: TOrder, columnKey: React.Key) => {
			switch (columnKey) {
				case "id":
					return (
						<span
							className="font-mono text-xs text-[var(--foreground)] inline-block max-w-[150px] truncate align-middle"
							title={order.id}
						>
							{order.id}
						</span>
					);
				case "customerName": {
					const customerName = order.client?.displayName || "-";
					const organizationName = getOrganizationName(order.organizationId);
					const billingAccount = order.billingAccount;

					const descriptionParts: string[] = [];
					if (organizationName) descriptionParts.push(organizationName);
					if (billingAccount)
						descriptionParts.push(`${billingAccount.name} (${billingAccount.number})`);
					const description =
						descriptionParts.length > 0 ? descriptionParts.join(" • ") : undefined;

					return (
						<div className="inline-flex items-center gap-2">
							<Avatar size="sm">
								<Avatar.Fallback>{getInitials(customerName)}</Avatar.Fallback>
							</Avatar>
							<div>
								<p className="text-sm font-medium text-[var(--foreground)]">{customerName}</p>
								{description && (
									<p className="text-xs text-[var(--muted)]">{description}</p>
								)}
							</div>
						</div>
					);
				}
				case "createdBy":
					return (
						<span className="text-sm text-[var(--foreground)]">
							{order.createdBy
								? t(`ordersPage:createdBy.${order.createdBy}`, order.createdBy)
								: "-"}
						</span>
					);
				case "paymentType":
					return (
						<span className="text-sm text-[var(--foreground)]">
							{order.paymentType !== undefined && order.paymentType !== null
								? t(`common:paymentTypes.${order.paymentType}`, order.paymentType)
								: "-"}
						</span>
					);
				case "total":
					return (
						<span className="text-sm font-semibold text-[var(--foreground)]">
							<Price price={order.cart.cartTotal} />
						</span>
					);
				case "date":
					return (
						<span className="text-sm text-[var(--muted)]">
							<DateView date={order.date} />
						</span>
					);
				case "status":
					return (
						<StatusPill
							status={order.status}
							label={t(`common:orderStatutes.${order.status}`, order.status)}
						/>
					);
				case "actions":
					return (
						<div className="flex items-center justify-end gap-2">
							<Button
								size="sm"
								variant="ghost"
								onPress={() =>
									modalApi.openModal("orderDetails", {
										order,
										onUpdated: (updated: TOrder) =>
											setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o))),
									})
								}
							>
								{t("ordersPage:actions.viewDetails", "פרטים")}
							</Button>
							<Button
								size="sm"
								variant="ghost"
								isIconOnly
								aria-label={t("ordersPage:actions.delete", "מחק")}
								onPress={() => {
									setOrderToCancel(order);
									setIsCancelOpen(true);
								}}
							>
								<Icon icon="lucide:trash-2" width={16} height={16} className="text-[var(--danger)]" />
							</Button>
						</div>
					);
				default:
					return null;
			}
		},
		[t, getOrganizationName]
	);

	const TABS: { key: TabKey; label: string }[] = [
		{ key: "active", label: t("ordersPage:tabs.active", "פעילות") },
		{ key: "completed", label: t("ordersPage:tabs.completed", "הסתיימו") },
		{ key: "all", label: t("ordersPage:tabs.all", "הכל") },
	];

	return (
		<div className="space-y-5">
			{/* Tabs */}
			<div className="flex items-center gap-1 border-b border-[var(--border)]">
				{TABS.map((tabDef) => {
					const active = tab === tabDef.key;
					return (
						<button
							key={tabDef.key}
							type="button"
							onClick={() => setTab(tabDef.key)}
							className={[
								"flex items-center gap-2 px-4 py-2.5 -mb-px text-sm font-semibold border-b-2 transition-colors",
								active
									? "border-[var(--accent)] text-[var(--accent)]"
									: "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]",
							].join(" ")}
						>
							{tabDef.label}
							<span
								className="min-w-5 h-5 px-1.5 grid place-items-center rounded-full text-[11px] font-bold"
								style={
									active
										? { backgroundColor: softBg("var(--accent)"), color: "var(--accent)" }
										: { backgroundColor: "var(--default)", color: "var(--muted)" }
								}
							>
								{counts[tabDef.key]}
							</span>
						</button>
					);
				})}
			</div>

			{/* Toolbar */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap items-center gap-2">
					<div className="relative">
						<Icon
							icon="lucide:search"
							className="absolute start-2 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
							width={16}
							height={16}
						/>
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={t("ordersPage:searchPlaceholder", "חיפוש הזמנה / לקוח...")}
							type="search"
							aria-label={t("ordersPage:searchPlaceholder", "חיפוש הזמנה / לקוח...")}
							className="ps-7 w-64"
						/>
					</div>
					<Select
						selectedKey={statusFilter}
						onSelectionChange={(key) => setStatusFilter(key as string)}
						aria-label={t("ordersPage:columns.status", "סטטוס")}
					>
						<Select.Trigger className="min-w-40">
							<Select.Value />
							<Select.Indicator />
						</Select.Trigger>
						<Select.Popover>
							<ListBox>
								<ListBox.Item id="all" textValue={t("ordersPage:filters.allStatuses", "כל הסטטוסים")}>
									{t("ordersPage:filters.allStatuses", "כל הסטטוסים")}
								</ListBox.Item>
								{ALL_STATUSES.map((s) => (
									<ListBox.Item key={s} id={s} textValue={t(`common:orderStatutes.${s}`, s)}>
										{t(`common:orderStatutes.${s}`, s)}
									</ListBox.Item>
								))}
							</ListBox>
						</Select.Popover>
					</Select>
				</div>

				<div className="flex items-center gap-2">
					<Button variant="ghost" onPress={syncOrders}>
						<Icon icon="lucide:refresh-cw" width={16} height={16} />
						{t("ordersPage:sync", "סנכרון")}
					</Button>
					<Button variant="ghost" onPress={exportOrders}>
						<Icon icon="lucide:download" width={16} height={16} />
						{t("ordersPage:export", "ייצוא")}
					</Button>
					<Button
						variant="primary"
						onPress={() =>
							modalApi.openModal("adminCreateOrder", {
								onOrderCreated: () => syncOrders(),
							})
						}
					>
						<Icon icon="lucide:plus" width={16} height={16} />
						{t("ordersPage:createOrder", "הזמנה חדשה")}
					</Button>
				</div>
			</div>

			{/* Table */}
			<div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
				<Table variant="secondary">
					<Table.ScrollContainer>
						<Table.Content
							aria-label="Orders table"
							className="min-w-[1000px] [&>thead>tr]:border-b [&>thead>tr]:border-[var(--border)] [&>tbody>tr]:border-b [&>tbody>tr]:border-[var(--border)] [&>tbody>tr:last-child]:border-0 [&>tbody>tr:hover]:bg-[var(--background)] [&>tbody>tr]:transition-colors"
						>
						<Table.Header>
							{headerColumns.map((column) => (
								<Table.Column
									key={column.uid}
									isRowHeader={column.uid === "id"}
									className="bg-[var(--background)] text-[11px] font-bold uppercase tracking-wide text-[var(--muted)] py-3"
								>
									{column.name}
								</Table.Column>
							))}
						</Table.Header>
						<Table.Body>
							{items.length === 0 ? (
								<Table.Row>
									<Table.Cell colSpan={headerColumns.length} className="text-center py-8 text-[var(--muted)]">
										{t("ordersPage:noOrders", "אין הזמנות")}
									</Table.Cell>
								</Table.Row>
							) : (
								items.map((order) => (
									<Table.Row key={order.id}>
										{headerColumns.map((column) => (
											<Table.Cell key={column.uid} className="py-3">
												{renderCell(order, column.uid)}
											</Table.Cell>
										))}
									</Table.Row>
								))
							)}
						</Table.Body>
						</Table.Content>
					</Table.ScrollContainer>
				</Table>

				{pages > 1 && (
					<div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-[var(--border)]">
						<span className="text-sm text-[var(--muted)]">
							{t("ordersPage:pagination.showing", "מציג {{start}} עד {{end}} פריטים", {
								start: filtered.length > 0 ? (page - 1) * rowsPerPage + 1 : 0,
								end: Math.min(page * rowsPerPage, filtered.length),
							})}
						</span>
						<Pagination className={isRTL ? "[&_svg]:scale-x-[-1]" : ""}>
							<Pagination.Content>
								<Pagination.Item>
									<Pagination.Previous onPress={() => setPage((p) => Math.max(1, p - 1))}>
										{""}
									</Pagination.Previous>
								</Pagination.Item>
								{Array.from({ length: pages }, (_, i) => (
									<Pagination.Item key={i + 1}>
										<Pagination.Link isActive={page === i + 1} onPress={() => setPage(i + 1)}>
											{i + 1}
										</Pagination.Link>
									</Pagination.Item>
								))}
								<Pagination.Item>
									<Pagination.Next onPress={() => setPage((p) => Math.min(pages, p + 1))}>
										{""}
									</Pagination.Next>
								</Pagination.Item>
							</Pagination.Content>
						</Pagination>
					</div>
				)}
			</div>

			{/* Cancel Order Modal */}
			<Modal.Backdrop isOpen={isCancelOpen} onOpenChange={setIsCancelOpen}>
				<Modal.Container>
					<Modal.Dialog>
						<Modal.Header>
							<Modal.Heading>{t("ordersPage:confirmCancel.title", "ביטול הזמנה")}</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<p>
								{t(
									"ordersPage:confirmCancel.message",
									"האם אתה בטוח שברצונך לבטל את ההזמנה הזו?"
								)}
							</p>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="ghost" onPress={() => setIsCancelOpen(false)}>
								{t("common:actions.cancel", "Close")}
							</Button>
							<Button variant="danger" onPress={confirmCancelOrder}>
								{t("ordersPage:actions.cancelOrder")}
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</div>
	);
}

export default AdminOrdersPages;
