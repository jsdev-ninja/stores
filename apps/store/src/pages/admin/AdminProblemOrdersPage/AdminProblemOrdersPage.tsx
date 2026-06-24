import { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import { Table, Input, Button, Pagination, Modal } from "@heroui/react";
import { useAppApi } from "src/appApi";
import { DateView } from "src/components/DateView";
import { Price } from "src/components/Price";
import { TOrder } from "src/domains/Order";
import { TOrganization } from "@jsdev_ninja/core";
import { modalApi } from "src/infra/modals";

// ─── Helpers ────────────────────────────────────────────────────────────────

function softBg(color: string, pct = 16) {
	return `color-mix(in oklab, ${color} ${pct}%, transparent)`;
}

// ─── Status pill (mirrors AdminOrdersPage exactly) ───────────────────────────

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

function StatusPill({ status, label }: { status: TOrder["status"]; label: string }) {
	const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
	return (
		<span
			className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
			style={{ backgroundColor: softBg(s.color), color: s.color }}
		>
			<Icon icon={s.icon} width={13} height={13} />
			{label}
		</span>
	);
}

// ─── Payment-status pill ─────────────────────────────────────────────────────

const PAYMENT_STATUS_STYLE: Record<TOrder["paymentStatus"], { color: string }> = {
	pending: { color: "var(--warning)" },
	pending_j5: { color: "var(--warning)" },
	external: { color: "var(--info)" },
	completed: { color: "var(--success)" },
	failed: { color: "var(--danger)" },
	refunded: { color: "var(--danger)" },
};

function PaymentStatusPill({ status, label }: { status: TOrder["paymentStatus"]; label: string }) {
	const s = PAYMENT_STATUS_STYLE[status] ?? PAYMENT_STATUS_STYLE.pending;
	return (
		<span
			className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
			style={{ backgroundColor: softBg(s.color), color: s.color }}
		>
			{label}
		</span>
	);
}

// ─── Group badge ─────────────────────────────────────────────────────────────

type GroupKey = "g1" | "g2" | "g3";

const GROUP_COLORS: Record<GroupKey, string> = {
	g1: "var(--warning)",
	g2: "var(--danger)",
	g3: "var(--info)",
};

function GroupBadge({ group }: { group: GroupKey }) {
	return (
		<span
			className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold whitespace-nowrap"
			style={{ backgroundColor: softBg(GROUP_COLORS[group]), color: GROUP_COLORS[group] }}
		>
			{group.toUpperCase()}
		</span>
	);
}

// ─── Classification ──────────────────────────────────────────────────────────

type ProblemOrder = TOrder & { groups: GroupKey[] };

type FilterKey = "all" | GroupKey;

function classifyOrders(orders: TOrder[]): { nonCancelled: TOrder[]; problems: ProblemOrder[] } {
	const nonCancelled = orders.filter((o) => o.status !== "cancelled");
	const problems: ProblemOrder[] = [];
	for (const order of nonCancelled) {
		const hasInvoice = !!(order.invoice || order.ezInvoice);
		const hasDeliveryNote = !!(order.deliveryNote || order.ezDeliveryNote);
		// Only flag missing docs when external payment is expected (or paymentType is absent — data error).
		// j5 (credit card / HYP) and "none" generate their own docs and never need external ones.
		const needsExternalDocs = order.paymentType === "external" || order.paymentType == null;

		const groups: GroupKey[] = [];
		if (order.status !== "completed") groups.push("g1");
		// External-payment orders are settled outside the system (cash / bank transfer),
		// so a non-"completed" paymentStatus is expected — don't flag them as unpaid.
		if (order.paymentStatus !== "completed" && order.paymentType !== "external")
			groups.push("g2");
		if (needsExternalDocs && (!hasInvoice || !hasDeliveryNote)) groups.push("g3");

		if (groups.length > 0) problems.push({ ...order, groups });
	}
	return { nonCancelled, problems };
}

// ─── Column definition ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getColumns(t: any) {
	return [
		{ name: t("problemOrdersPage:columns.date"), uid: "date" },
		{ name: t("problemOrdersPage:columns.customer"), uid: "customer" },
		{ name: t("problemOrdersPage:columns.status"), uid: "status" },
		{ name: t("problemOrdersPage:columns.paymentStatus"), uid: "paymentStatus" },
		{ name: t("problemOrdersPage:columns.paymentType"), uid: "paymentType" },
		{ name: t("problemOrdersPage:columns.total"), uid: "total" },
		{ name: t("problemOrdersPage:columns.invoice"), uid: "invoice" },
		{ name: t("problemOrdersPage:columns.deliveryNote"), uid: "deliveryNote" },
		{ name: t("problemOrdersPage:columns.groups"), uid: "groups" },
		{ name: t("problemOrdersPage:columns.orderId"), uid: "id" },
		{ name: t("problemOrdersPage:columns.actions"), uid: "actions" },
	] as const;
}

// ─── Page component ──────────────────────────────────────────────────────────

const ROWS_PER_PAGE = 15;
const FETCH_LIMIT = 200;

function AdminProblemOrdersPage() {
	const appApi = useAppApi();
	const { t, i18n } = useTranslation(["common", "problemOrdersPage"]);
	const isRTL = i18n.dir() === "rtl";

	const [allOrders, setAllOrders] = useState<TOrder[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [filter, setFilter] = useState<FilterKey>("all");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);

	// Organization list for customer-cell display
	const [organizations, setOrganizations] = useState<TOrganization[]>([]);

	// Cancel-order dialog state — one nullable ID covers both "is cancelling" and "which one"
	const [orderToCancel, setOrderToCancel] = useState<TOrder | null>(null);
	const [isCancelling, setIsCancelling] = useState(false);

	// Complete-order dialog state
	const [orderToComplete, setOrderToComplete] = useState<TOrder | null>(null);
	const [isCompleting, setIsCompleting] = useState(false);

	useEffect(() => {
		setIsLoading(true);
		appApi.admin.getStoreOrders({ limit: FETCH_LIMIT }).then((res) => {
			if (res) setAllOrders(res.data);
			setIsLoading(false);
		});
	}, []);

	useEffect(() => {
		appApi.admin.listOrganizations().then((result) => {
			if (result?.success) setOrganizations((result.data || []) as TOrganization[]);
		});
	}, []); // eslint-disable-line react-hooks/exhaustive-deps -- appApi stable

	const { nonCancelledOrders, problemOrders } = useMemo(() => {
		const { nonCancelled, problems } = classifyOrders(allOrders);
		return { nonCancelledOrders: nonCancelled, problemOrders: problems };
	}, [allOrders]);

	const counts = useMemo(
		() => ({
			all: problemOrders.length,
			g1: problemOrders.filter((o) => o.groups.includes("g1")).length,
			g2: problemOrders.filter((o) => o.groups.includes("g2")).length,
			g3: problemOrders.filter((o) => o.groups.includes("g3")).length,
		}),
		[problemOrders]
	);

	const summaryCounts = useMemo(
		() => ({
			total: nonCancelledOrders.length,
			withProblems: problemOrders.length,
			clean: nonCancelledOrders.length - problemOrders.length,
		}),
		[nonCancelledOrders, problemOrders]
	);

	const orgNameById = useMemo(() => {
		const map = new Map<string, string>();
		organizations.forEach((o) => map.set(o.id, o.name));
		return map;
	}, [organizations]);

	const filtered = useMemo(() => {
		let list = problemOrders;
		if (filter !== "all") list = list.filter((o) => o.groups.includes(filter));

		const q = search.trim().toLowerCase();
		if (q) {
			list = list.filter(
				(o) =>
					o.id.toLowerCase().includes(q) ||
					(o.client?.displayName ?? "").toLowerCase().includes(q) ||
					(o.nameOnInvoice ?? "").toLowerCase().includes(q)
			);
		}
		return list;
	}, [problemOrders, filter, search]);

	useEffect(() => {
		setPage(1);
	}, [filter, search]);

	const pages = Math.ceil(filtered.length / ROWS_PER_PAGE) || 1;
	const pageItems = useMemo(() => {
		const start = (page - 1) * ROWS_PER_PAGE;
		return filtered.slice(start, start + ROWS_PER_PAGE);
	}, [page, filtered]);

	const columns = useMemo(() => getColumns(t), [t]);

	// ─── Cancel order flow ───────────────────────────────────────────────────

	const handleCancelConfirm = useCallback(async () => {
		if (!orderToCancel) return;
		setIsCancelling(true);
		const res = await appApi.admin.cancelOrder({ order: orderToCancel });
		setIsCancelling(false);
		if (res?.success) {
			setAllOrders((prev) =>
				prev.map((o) => (o.id === orderToCancel.id ? { ...o, status: "cancelled" as const } : o))
			);
		}
		setOrderToCancel(null);
	}, [appApi.admin, orderToCancel]);

	const handleCancelDismiss = useCallback(() => {
		if (isCancelling) return;
		setOrderToCancel(null);
	}, [isCancelling]);

	// ─── Complete order flow ─────────────────────────────────────────────────

	const handleCompleteConfirm = useCallback(async () => {
		if (!orderToComplete) return;
		setIsCompleting(true);
		const res = await appApi.admin.orderPaid({ order: orderToComplete });
		setIsCompleting(false);
		if (res?.success) {
			setAllOrders((prev) =>
				prev.map((o) => (o.id === orderToComplete.id ? { ...o, status: "completed" as const } : o))
			);
		}
		setOrderToComplete(null);
	}, [appApi.admin, orderToComplete]);

	const handleCompleteDismiss = useCallback(() => {
		if (isCompleting) return;
		setOrderToComplete(null);
	}, [isCompleting]);

	// ─── Cell renderer ───────────────────────────────────────────────────────

	const renderCell = useCallback(
		(order: ProblemOrder, columnKey: string) => {
			switch (columnKey) {
				case "date":
					return (
						<span className="text-sm text-[var(--muted)] whitespace-nowrap">
							<DateView date={order.date} />
						</span>
					);
				case "customer": {
					const name = order.client?.displayName ?? order.nameOnInvoice ?? "—";
					const orgName =
						(order.organizationId && orgNameById.get(order.organizationId)) || order.companyName || null;
					return (
						<div className="flex flex-col">
							<span className="text-sm text-[var(--foreground)]">{name}</span>
							{orgName && <span className="text-xs text-[var(--muted)]">{orgName}</span>}
						</div>
					);
				}
				case "status":
					return (
						<StatusPill
							status={order.status}
							label={t(`common:orderStatutes.${order.status}`, order.status)}
						/>
					);
				case "paymentStatus":
					return (
						<PaymentStatusPill
							status={order.paymentStatus}
							label={t(`common:paymentStatuses.${order.paymentStatus}`, order.paymentStatus)}
						/>
					);
				case "paymentType":
					return (
						<span className="text-sm text-[var(--foreground)]">
							{order.paymentType
								? t(`common:paymentTypes.${order.paymentType}`, order.paymentType)
								: "—"}
						</span>
					);
				case "total":
					return (
						<span className="text-sm font-semibold text-[var(--foreground)] whitespace-nowrap">
							<Price price={order.cart.cartTotal} />
						</span>
					);
				case "invoice": {
					const has = !!(order.invoice || order.ezInvoice);
					return (
						<span
							className="text-base font-bold"
							style={{ color: has ? "var(--success)" : "var(--muted)" }}
							aria-label={has ? t("problemOrdersPage:aria.hasInvoice") : t("problemOrdersPage:aria.noInvoice")}
						>
							{has ? "✓" : "–"}
						</span>
					);
				}
				case "deliveryNote": {
					const has = !!(order.deliveryNote || order.ezDeliveryNote);
					return (
						<span
							className="text-base font-bold"
							style={{ color: has ? "var(--success)" : "var(--muted)" }}
							aria-label={has ? t("problemOrdersPage:aria.hasDeliveryNote") : t("problemOrdersPage:aria.noDeliveryNote")}
						>
							{has ? "✓" : "–"}
						</span>
					);
				}
				case "groups":
					return (
						<div className="flex items-center gap-1 flex-wrap">
							{order.groups.map((g) => (
								<GroupBadge key={g} group={g} />
							))}
						</div>
					);
				case "id":
					return (
						<div className="flex items-center gap-2">
							<span
								className="font-mono text-xs text-[var(--muted)] inline-block max-w-[120px] truncate"
								title={order.id}
							>
								{order.id}
							</span>
							<Button
								size="sm"
								variant="ghost"
								onPress={() =>
									modalApi.openModal("orderDetails", {
										order,
										onUpdated: (updated: TOrder) =>
											setAllOrders((prev) =>
												prev.map((o) => (o.id === updated.id ? updated : o))
											),
									})
								}
							>
								{t("problemOrdersPage:actions.viewDetails")}
							</Button>
						</div>
					);
				case "actions": {
					const isCancellable = order.status !== "cancelled" && order.status !== "refunded";
					const isCompletable =
						order.status !== "completed" && order.status !== "cancelled" && order.status !== "refunded";
					return (
						<div className="flex items-center gap-1">
							<Button
								size="sm"
								variant="ghost"
								isDisabled={!isCompletable}
								onPress={() => {
									if (isCompletable) setOrderToComplete(order);
								}}
								onClick={(e: React.MouseEvent) => e.stopPropagation()}
								aria-label={t("problemOrdersPage:actions.markCompleted")}
							>
								<Icon
									icon="lucide:circle-check"
									width={15}
									height={15}
									className={isCompletable ? "text-[var(--success)]" : "text-[var(--muted)]"}
								/>
								{t("problemOrdersPage:actions.markCompleted")}
							</Button>
							<Button
								size="sm"
								variant="ghost"
								isDisabled={!isCancellable}
								onPress={() => {
									if (isCancellable) setOrderToCancel(order);
								}}
								// Stop the row's click (e.g. future row-click handlers) from firing
								// when the cancel button is pressed — matching AdminOrdersPage pattern.
								onClick={(e: React.MouseEvent) => e.stopPropagation()}
								aria-label={t("problemOrdersPage:actions.cancelOrder")}
							>
								<Icon
									icon="lucide:x-circle"
									width={15}
									height={15}
									className={isCancellable ? "text-[var(--danger)]" : "text-[var(--muted)]"}
								/>
								{t("problemOrdersPage:actions.cancelOrder")}
							</Button>
						</div>
					);
				}
				default:
					return null;
			}
		},
		[t, orgNameById]
	);

	const FILTER_CHIPS: { key: FilterKey; label: string }[] = [
		{ key: "all", label: t("problemOrdersPage:filters.all") },
		{ key: "g1", label: t("problemOrdersPage:filters.g1") },
		{ key: "g2", label: t("problemOrdersPage:filters.g2") },
		{ key: "g3", label: t("problemOrdersPage:filters.g3") },
	];

	return (
		<div className="space-y-6">
			{/* Page heading */}
			<h1 className="text-2xl font-bold text-[var(--foreground)]">
				{t("problemOrdersPage:title")}
			</h1>

			{/* Summary cards */}
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
				{[
					{
						label: t("problemOrdersPage:summary.total"),
						value: summaryCounts.total,
						color: "var(--foreground)",
					},
					{
						label: t("problemOrdersPage:summary.withProblems"),
						value: summaryCounts.withProblems,
						color: "var(--danger)",
					},
					{
						label: t("problemOrdersPage:summary.clean"),
						value: summaryCounts.clean,
						color: "var(--success)",
					},
					{
						label: t("problemOrdersPage:summary.g1Count"),
						value: counts.g1,
						color: GROUP_COLORS.g1,
					},
					{
						label: t("problemOrdersPage:summary.g2Count"),
						value: counts.g2,
						color: GROUP_COLORS.g2,
					},
					{
						label: t("problemOrdersPage:summary.g3Count"),
						value: counts.g3,
						color: GROUP_COLORS.g3,
					},
				].map((card) => (
					<div
						key={card.label}
						className="rounded-xl bg-[var(--surface)] border border-[var(--border)] px-4 py-3 flex flex-col gap-1"
					>
						<span className="text-xs text-[var(--muted)] leading-tight">{card.label}</span>
						<span className="text-2xl font-bold" style={{ color: card.color }}>
							{isLoading ? "—" : card.value}
						</span>
					</div>
				))}
			</div>

			{/* Filter chips + search toolbar */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap items-center gap-1.5">
					{FILTER_CHIPS.map((chip) => {
						const isActive = filter === chip.key;
						const count = counts[chip.key as FilterKey] ?? counts.all;
						return (
							<button
								key={chip.key}
								type="button"
								onClick={() => setFilter(chip.key)}
								className={[
									"flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors",
									isActive
										? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]"
										: "bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--foreground)]",
								].join(" ")}
							>
								{chip.label}
								<span
									className="min-w-5 h-5 px-1.5 grid place-items-center rounded-full text-[11px] font-bold"
									style={
										isActive
											? { backgroundColor: softBg("var(--accent-foreground)"), color: "var(--accent-foreground)" }
											: { backgroundColor: "var(--default)", color: "var(--muted)" }
									}
								>
									{count}
								</span>
							</button>
						);
					})}
				</div>

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
						placeholder={t("problemOrdersPage:searchPlaceholder")}
						type="search"
						aria-label={t("problemOrdersPage:searchPlaceholder")}
						className="ps-7 w-72"
					/>
				</div>
			</div>

			{/* Table */}
			<div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
				<Table variant="secondary">
					<Table.ScrollContainer>
						<Table.Content
							aria-label="Problem orders table"
							className="min-w-[1200px] [&>thead>tr]:border-b [&>thead>tr]:border-[var(--border)] [&>tbody>tr]:border-b [&>tbody>tr]:border-[var(--border)] [&>tbody>tr:last-child]:border-0 [&>tbody>tr:hover]:bg-[var(--background)] [&>tbody>tr]:transition-colors"
						>
							<Table.Header>
								{columns.map((col) => (
									<Table.Column
										key={col.uid}
										isRowHeader={col.uid === "date"}
										className="bg-[var(--background)] text-[11px] font-bold uppercase tracking-wide text-[var(--muted)] py-3"
									>
										{col.name}
									</Table.Column>
								))}
							</Table.Header>
							<Table.Body>
								{isLoading ? (
									<Table.Row>
										<Table.Cell colSpan={columns.length} className="text-center py-10 text-[var(--muted)]">
											{t("common:loading")}
										</Table.Cell>
									</Table.Row>
								) : pageItems.length === 0 ? (
									<Table.Row>
										<Table.Cell colSpan={columns.length} className="text-center py-10">
											<div className="flex flex-col items-center gap-2">
												<Icon icon="lucide:check-circle" width={36} height={36} className="text-[var(--success)]" />
												<span className="text-[var(--muted)] text-sm">
													{t("problemOrdersPage:emptyState")}
												</span>
											</div>
										</Table.Cell>
									</Table.Row>
								) : (
									pageItems.map((order) => (
										<Table.Row key={order.id}>
											{columns.map((col) => (
												<Table.Cell key={col.uid} className="py-3">
													{renderCell(order, col.uid)}
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
							{t("problemOrdersPage:pagination.showing", {
								start: filtered.length > 0 ? (page - 1) * ROWS_PER_PAGE + 1 : 0,
								end: Math.min(page * ROWS_PER_PAGE, filtered.length),
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

			{/* Group legend — labels sourced from i18n filter keys (no hardcoded GROUP_LABELS_HE) */}
			<div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
				{(["g1", "g2", "g3"] as GroupKey[]).map((g) => (
					<span key={g} className="flex items-center gap-1.5">
						<GroupBadge group={g} />
						<span>{t(`problemOrdersPage:filters.${g}`)}</span>
					</span>
				))}
			</div>

			{/* Cancel order confirmation modal — same pattern as AdminOrdersPage */}
			<Modal.Backdrop isOpen={orderToCancel !== null} onOpenChange={handleCancelDismiss}>
				<Modal.Container>
					<Modal.Dialog>
						<Modal.Header>
							<Modal.Heading>{t("problemOrdersPage:confirmCancel.title")}</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<p>{t("problemOrdersPage:confirmCancel.message")}</p>
							<p className="mt-2 text-sm text-[var(--warning)]">
								{t("problemOrdersPage:confirmCancel.paidWarning")}
							</p>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="ghost" isDisabled={isCancelling} onPress={handleCancelDismiss}>
								{t("common:cancel")}
							</Button>
							<Button variant="danger" isDisabled={isCancelling} onPress={handleCancelConfirm}>
								{isCancelling
									? t("problemOrdersPage:actions.cancelling")
									: t("problemOrdersPage:actions.cancelOrder")}
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>

			{/* Mark as completed confirmation modal */}
			<Modal.Backdrop isOpen={orderToComplete !== null} onOpenChange={handleCompleteDismiss}>
				<Modal.Container>
					<Modal.Dialog>
						<Modal.Header>
							<Modal.Heading>{t("problemOrdersPage:confirmComplete.title")}</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<p>{t("problemOrdersPage:confirmComplete.message")}</p>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="ghost" isDisabled={isCompleting} onPress={handleCompleteDismiss}>
								{t("common:cancel")}
							</Button>
							<Button variant="primary" isDisabled={isCompleting} onPress={handleCompleteConfirm}>
								{isCompleting
									? t("problemOrdersPage:actions.completing")
									: t("problemOrdersPage:actions.markCompleted")}
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</div>
	);
}

export default AdminProblemOrdersPage;
