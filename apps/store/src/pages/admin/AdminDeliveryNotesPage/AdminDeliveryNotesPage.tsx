import { useState, useEffect, useCallback, useMemo } from "react";
import { Table, Input, Select, ListBox, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { modalApi } from "src/infra/modals";
import { TOrder, TOrganization } from "@jsdev_ninja/core";
import { useAppApi } from "src/appApi";

// ─── Helpers ────────────────────────────────────────────────────────────────

function softBg(color: string, pct = 14) {
	return `color-mix(in oklab, ${color} ${pct}%, transparent)`;
}

function fmtDate(ms?: number): string {
	if (!ms) return "—";
	const v = ms < 1e12 ? ms * 1000 : ms;
	try {
		return new Date(v).toLocaleDateString("he-IL");
	} catch {
		return "—";
	}
}

// Legacy amounts are stored in shekels (the prior page rendered cartTotal directly).
function fmtMoney(n: number): string {
	return "₪" + n.toLocaleString("he-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// A "delivery note" row is an order. Prefer the embedded TDeliveryNote, fall
// back to order-level fields (both are real data on the order).
function dnNumber(o: TOrder): string {
	return o.deliveryNote?.number ?? o.ezDeliveryNote?.doc_number ?? "—";
}
function dnPdf(o: TOrder): string | undefined {
	return o.deliveryNote?.link ?? o.ezDeliveryNote?.pdf_link ?? o.ezDeliveryNote?.pdf_link_copy;
}
function dnDate(o: TOrder): number {
	return o.deliveryNote?.date ?? o.date;
}
function dnItemCount(o: TOrder): number {
	return o.deliveryNote?.items?.length ?? o.cart?.items?.length ?? 0;
}
function dnTotal(o: TOrder): number {
	return o.deliveryNote?.total ?? o.cart?.cartTotal ?? 0;
}
type DnStatus = "pending" | "paid" | "cancelled";
function dnStatus(o: TOrder): DnStatus | undefined {
	return o.deliveryNote?.status;
}

// ─── Status pill ──────────────────────────────────────────────────────────────

const STATUS_META: Record<DnStatus, { label: string; color: string }> = {
	pending: { label: "ממתין", color: "var(--warning)" },
	paid: { label: "שולם", color: "var(--success)" },
	cancelled: { label: "בוטל", color: "var(--danger)" },
};

function StatusPill({ status }: { status?: DnStatus }) {
	if (!status) return <span className="text-sm text-[var(--muted)]">—</span>;
	const meta = STATUS_META[status];
	return (
		<span
			className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
			style={{ backgroundColor: softBg(meta.color, 16), color: meta.color }}
		>
			{meta.label}
		</span>
	);
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
	return (
		<div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)]">
			<span className="block mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
				{label}
			</span>
			<b
				className="block text-2xl font-extrabold leading-none tracking-tight"
				style={{ color: color ?? "var(--foreground)" }}
			>
				{value}
			</b>
		</div>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const COLUMNS = [
	{ uid: "number", label: "מס׳ תעודה" },
	{ uid: "date", label: "תאריך" },
	{ uid: "company", label: "חברה" },
	{ uid: "items", label: "פריטים" },
	{ uid: "total", label: 'סה"כ' },
	{ uid: "status", label: "סטטוס" },
	{ uid: "actions", label: "" },
];

export default function AdminDeliveryNotesPage() {
	const appApi = useAppApi();

	const [deliveryNotes, setDeliveryNotes] = useState<TOrder[]>([]);
	const [organizations, setOrganizations] = useState<TOrganization[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

	const [search, setSearch] = useState("");
	const [companyFilter, setCompanyFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");

	const getMonthRange = (date: Date) => {
		const year = date.getFullYear();
		const month = date.getMonth();
		return {
			fromDate: new Date(year, month, 1).getTime(),
			toDate: new Date(year, month + 1, 0, 23, 59, 59, 999).getTime(),
		};
	};

	const loadDeliveryNotes = useCallback(async () => {
		setIsLoading(true);
		try {
			const { fromDate, toDate } = getMonthRange(selectedMonth);
			const result = await appApi.admin.getDeliveryNotes({ fromDate, toDate });
			if (result?.success) setDeliveryNotes(result.data || []);
		} catch (error) {
			console.error("Failed to load delivery notes:", error);
		} finally {
			setIsLoading(false);
		}
	}, [selectedMonth]); // eslint-disable-line react-hooks/exhaustive-deps -- appApi stable

	useEffect(() => {
		loadDeliveryNotes();
	}, [loadDeliveryNotes]);

	useEffect(() => {
		appApi.admin.listOrganizations().then((result) => {
			if (result?.success) setOrganizations((result.data || []) as TOrganization[]);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps -- appApi stable
	}, []);

	const orgNameById = useMemo(() => {
		const map = new Map<string, string>();
		organizations.forEach((o) => map.set(o.id, o.name));
		return map;
	}, [organizations]);

	const companyName = (o: TOrder) =>
		(o.organizationId && orgNameById.get(o.organizationId)) ||
		o.deliveryNote?.companyDetails?.name ||
		"—";

	const monthDisplay = selectedMonth.toLocaleDateString("he-IL", { year: "numeric", month: "long" });

	// KPIs over the whole month (not the filtered subset) — design semantics.
	const kpis = useMemo(() => {
		const total = deliveryNotes.length;
		const pendingNotes = deliveryNotes.filter((o) => dnStatus(o) === "pending");
		const pendingAmount = pendingNotes.reduce((sum, o) => sum + dnTotal(o), 0);
		return { total, pendingCount: pendingNotes.length, pendingAmount };
	}, [deliveryNotes]);

	const filtered = useMemo(() => {
		let list = deliveryNotes;
		if (companyFilter !== "all") list = list.filter((o) => o.organizationId === companyFilter);
		if (statusFilter !== "all") list = list.filter((o) => dnStatus(o) === statusFilter);
		const q = search.trim().toLowerCase();
		if (q) {
			list = list.filter(
				(o) =>
					dnNumber(o).toLowerCase().includes(q) || companyName(o).toLowerCase().includes(q)
			);
		}
		// Newest first
		return [...list].sort((a, b) => dnDate(b) - dnDate(a));
	}, [deliveryNotes, companyFilter, statusFilter, search]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleCreate = () => {
		modalApi.openModal("createDeliveryNote", { onDeliveryNoteCreated: () => loadDeliveryNotes() });
	};

	const shiftMonth = (delta: number) =>
		setSelectedMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

	return (
		<div className="space-y-5">
			{/* Toolbar */}
			<div className="flex items-center justify-between gap-3 flex-wrap">
				{/* Search + filters */}
				<div className="flex items-center gap-2 flex-wrap">
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
							placeholder="חיפוש מספר תעודה / חברה..."
							type="search"
							aria-label="חיפוש תעודת משלוח"
							className="ps-7 w-64"
						/>
					</div>

					<div className="w-48">
						<Select
							selectedKey={companyFilter}
							onSelectionChange={(k) => setCompanyFilter(k as string)}
							aria-label="סינון לפי חברה"
						>
							<Select.Trigger>
								<Select.Value />
								<Select.Indicator />
							</Select.Trigger>
							<Select.Popover>
								<ListBox>
									<ListBox.Item id="all" textValue="כל החברות">
										כל החברות
									</ListBox.Item>
									{organizations.map((org) => (
										<ListBox.Item key={org.id} id={org.id} textValue={org.name}>
											{org.name}
										</ListBox.Item>
									))}
								</ListBox>
							</Select.Popover>
						</Select>
					</div>

					<div className="w-40">
						<Select
							selectedKey={statusFilter}
							onSelectionChange={(k) => setStatusFilter(k as string)}
							aria-label="סינון לפי סטטוס"
						>
							<Select.Trigger>
								<Select.Value />
								<Select.Indicator />
							</Select.Trigger>
							<Select.Popover>
								<ListBox>
									<ListBox.Item id="all" textValue="כל הסטטוסים">
										כל הסטטוסים
									</ListBox.Item>
									<ListBox.Item id="pending" textValue="ממתין">
										ממתין
									</ListBox.Item>
									<ListBox.Item id="paid" textValue="שולם">
										שולם
									</ListBox.Item>
									<ListBox.Item id="cancelled" textValue="בוטל">
										בוטל
									</ListBox.Item>
								</ListBox>
							</Select.Popover>
						</Select>
					</div>
				</div>

				{/* Month nav + create */}
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-1">
						<Button isIconOnly variant="ghost" size="sm" onPress={() => shiftMonth(-1)} aria-label="חודש קודם">
							<Icon icon="lucide:chevron-right" width={16} height={16} />
						</Button>
						<span className="text-sm font-semibold text-[var(--foreground)] min-w-[7.5rem] text-center">
							{monthDisplay}
						</span>
						<Button isIconOnly variant="ghost" size="sm" onPress={() => shiftMonth(1)} aria-label="חודש הבא">
							<Icon icon="lucide:chevron-left" width={16} height={16} />
						</Button>
					</div>

					<Button variant="primary" onPress={handleCreate}>
						<Icon icon="lucide:plus" width={14} height={14} />
						תעודה חדשה
					</Button>
				</div>
			</div>

			{/* KPIs */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<KpiCard label="סך תעודות" value={kpis.total} />
				<KpiCard label="ממתינות לתשלום" value={kpis.pendingCount} color="var(--warning)" />
				<KpiCard label="סכום ממתין" value={fmtMoney(kpis.pendingAmount)} color="var(--warning)" />
			</div>

			{/* Table */}
			<div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
				<Table variant="secondary">
					<Table.ScrollContainer>
						<Table.Content
							aria-label="Delivery notes table"
							className="min-w-[860px] [&>thead>tr]:border-b [&>thead>tr]:border-[var(--border)] [&>tbody>tr]:border-b [&>tbody>tr]:border-[var(--border)] [&>tbody>tr:last-child]:border-0 [&>tbody>tr:hover]:bg-[var(--background)] [&>tbody>tr]:transition-colors"
						>
							<Table.Header>
								{COLUMNS.map((col) => (
									<Table.Column
										key={col.uid}
										isRowHeader={col.uid === "number"}
										className="text-[11px] font-bold uppercase tracking-wide text-[var(--foreground)] py-3"
										style={{ backgroundColor: "var(--default)", borderRadius: 0 }}
									>
										{col.label}
									</Table.Column>
								))}
							</Table.Header>
							<Table.Body>
								{isLoading ? (
									<Table.Row>
										<Table.Cell colSpan={COLUMNS.length} className="text-center py-10 text-[var(--muted)]">
											<Icon icon="lucide:loader-2" className="mx-auto h-6 w-6 animate-spin" />
										</Table.Cell>
									</Table.Row>
								) : filtered.length === 0 ? (
									<Table.Row>
										<Table.Cell colSpan={COLUMNS.length} className="text-center py-8 text-[var(--muted)]">
											{search || companyFilter !== "all" || statusFilter !== "all"
												? "לא נמצאו תעודות התואמות לסינון"
												: "אין תעודות משלוח לחודש זה"}
										</Table.Cell>
									</Table.Row>
								) : (
									filtered.map((o) => {
										const pdf = dnPdf(o);
										return (
											<Table.Row key={o.id}>
												{/* מס׳ תעודה */}
												<Table.Cell className="py-3">
													<span className="font-semibold text-sm text-[var(--foreground)]">
														{dnNumber(o)}
													</span>
												</Table.Cell>

												{/* תאריך */}
												<Table.Cell className="py-3">
													<span className="text-sm text-[var(--muted)]">{fmtDate(dnDate(o))}</span>
												</Table.Cell>

												{/* חברה */}
												<Table.Cell className="py-3">
													<span className="text-sm text-[var(--foreground)]">{companyName(o)}</span>
												</Table.Cell>

												{/* פריטים */}
												<Table.Cell className="py-3">
													<span className="text-sm text-[var(--muted)]">
														{dnItemCount(o)} פריטים
													</span>
												</Table.Cell>

												{/* סה"כ */}
												<Table.Cell className="py-3">
													<span className="text-sm font-bold text-[var(--foreground)]">
														{fmtMoney(dnTotal(o))}
													</span>
												</Table.Cell>

												{/* סטטוס */}
												<Table.Cell className="py-3">
													<StatusPill status={dnStatus(o)} />
												</Table.Cell>

												{/* Actions — צפה (open PDF) + הפק חשבונית */}
												<Table.Cell className="py-3">
													<div className="flex items-center gap-1.5 justify-end">
														{pdf ? (
															<a
																href={pdf}
																target="_blank"
																rel="noopener noreferrer"
																className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border border-[var(--border)] text-[var(--foreground)] bg-[var(--surface)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
															>
																<Icon icon="lucide:eye" width={13} height={13} />
																צפה
															</a>
														) : (
															<span className="text-sm text-[var(--muted)]">—</span>
														)}
														{dnNumber(o) !== "—" && !o.invoice && !o.ezInvoice && !!o.ezDeliveryNote?.doc_uuid && (
															<button
																type="button"
																className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border border-[var(--border)] text-[var(--foreground)] bg-[var(--surface)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
																onClick={() =>
																	modalApi.openModal("invoiceDetails", {
																		selectedOrders: [o],
																		linkedDeliveryNote: { docUuid: o.ezDeliveryNote?.doc_uuid ?? "", number: dnNumber(o) },
																		requireAllocation:
																			(o.cart?.cartTotal ?? 0) >= 25000,
																		onInvoiceCreated: () => loadDeliveryNotes(),
																	})
																}
															>
																<Icon icon="lucide:file-text" width={13} height={13} />
																הפק חשבונית
															</button>
														)}
													</div>
												</Table.Cell>
											</Table.Row>
										);
									})
								)}
							</Table.Body>
						</Table.Content>
					</Table.ScrollContainer>
				</Table>
			</div>
		</div>
	);
}
