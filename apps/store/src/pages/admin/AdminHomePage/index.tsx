import { useEffect, useState, useMemo } from "react";
import { Chip, ChipProps } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Link } from "src/navigation";
import { useAppApi } from "src/appApi";
import { FirebaseApi } from "src/lib/firebase";
import type { TOrder } from "@jsdev_ninja/core";
import type { TProfile } from "@jsdev_ninja/core";

type Tone = "up" | "down" | "flat";

const TONE_COLOR: Record<Tone, string> = {
	up: "var(--accent)",
	down: "var(--brand-secondary)",
	flat: "var(--muted)",
};

const STATUS: Record<string, { color: ChipProps["color"]; label: string }> = {
	draft: { color: "default", label: "טיוטה" },
	pending: { color: "default", label: "ממתין לאישור" },
	processing: { color: "accent", label: "בטיפול" },
	in_delivery: { color: "accent", label: "במשלוח" },
	delivered: { color: "accent", label: "נמסר" },
	completed: { color: "success", label: "הושלם" },
	cancelled: { color: "danger", label: "בוטל" },
	refunded: { color: "danger", label: "זוכה" },
};

const ACTIVE_STATUSES: TOrder["status"][] = ["pending", "processing", "in_delivery", "draft"];

const LOW_STOCK: { name: string; left: string }[] = [
	{ name: 'קפה שחור טחון 1 ק"ג', left: "4 יח'" },
	{ name: "חלב סויה 1 ל'", left: "7 יח'" },
	{ name: "סוכר חום 500 גר'", left: "9 יח'" },
	{ name: "מפיות נייר (50)", left: "12 יח'" },
];

function softBg(color: string, pct = 14) {
	return `color-mix(in oklab, ${color} ${pct}%, transparent)`;
}

function formatDayMonth(epochMs: number): string {
	const d = new Date(epochMs);
	const day = String(d.getDate()).padStart(2, "0");
	const month = String(d.getMonth() + 1).padStart(2, "0");
	return `${day}/${month}`;
}

function formatRevenue(amount: number): string {
	return "₪" + amount.toLocaleString("he-IL");
}

function KpiCard({
	label,
	value,
	trend,
	trendMock,
	tone,
	icon,
	color,
}: {
	label: string;
	value: string;
	trend: string;
	trendMock?: boolean;
	tone: Tone;
	icon: string;
	color: string;
	mockCard?: boolean;
}) {
	return (
		<div className="flex items-center gap-3.5 p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]">
			<div
				className="grid place-items-center size-12 rounded-xl shrink-0"
				style={{ backgroundColor: softBg(color), color }}
			>
				<Icon icon={icon} width={22} height={22} />
			</div>
			<div className="flex-1 min-w-0">
				<span className="block mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
					{label}
				</span>
				<b className="block text-2xl font-extrabold leading-none tracking-tight text-[var(--foreground)]">
					{value}
				</b>
				<span className="block mt-1.5 text-[11.5px] font-medium" style={{ color: TONE_COLOR[tone] }}>
					{trend}
					{trendMock && (
						<span className="ms-1.5 text-[10px] font-bold text-[var(--warning)] opacity-70">(MOCK)</span>
					)}
				</span>
			</div>
		</div>
	);
}

function MockKpiCard({
	label,
	value,
	trend,
	tone,
	icon,
	color,
}: {
	label: string;
	value: string;
	trend: string;
	tone: Tone;
	icon: string;
	color: string;
}) {
	return (
		<div className="relative flex items-center gap-3.5 p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]">
			<div
				className="grid place-items-center size-12 rounded-xl shrink-0"
				style={{ backgroundColor: softBg(color), color }}
			>
				<Icon icon={icon} width={22} height={22} />
			</div>
			<div className="flex-1 min-w-0">
				<span className="flex items-center gap-2 mb-1.5">
					<span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
						{label}
					</span>
					<Chip size="sm" variant="soft" color="warning">
						<Chip.Label>MOCK</Chip.Label>
					</Chip>
				</span>
				<b className="block text-2xl font-extrabold leading-none tracking-tight text-[var(--foreground)]">
					{value}
				</b>
				<span className="block mt-1.5 text-[11.5px] font-medium" style={{ color: TONE_COLOR[tone] }}>
					{trend}
				</span>
			</div>
		</div>
	);
}

function CardBlock({
	title,
	action,
	titleBadge,
	children,
}: {
	title: string;
	action?: React.ReactNode;
	titleBadge?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
			<div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border)]">
				<div className="flex items-center gap-2">
					<h3 className="text-base font-extrabold tracking-tight text-[var(--foreground)]">{title}</h3>
					{titleBadge}
				</div>
				{action}
			</div>
			{children}
		</div>
	);
}

function ViewAllLink({ to, children }: { to: any; children: React.ReactNode }) {
	return (
		<Link
			to={to}
			params={{}}
			className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] hover:opacity-80 whitespace-nowrap"
		>
			{children}
		</Link>
	);
}

function AdminHomePage() {
	const appApi = useAppApi();

	const [orders, setOrders] = useState<TOrder[]>([]);
	const [clients, setClients] = useState<TProfile[]>([]);
	const [openDebtTotal, setOpenDebtTotal] = useState<number | null>(null);

	useEffect(() => {
		appApi.admin.getStoreOrders().then((res) => {
			if (res?.data) setOrders(res.data);
		});
	}, []);

	useEffect(() => {
		appApi.admin.getStoreClients().then((res) => {
			if (res?.success) setClients(res.data);
		});
	}, []);

	useEffect(() => {
		FirebaseApi.api.listBudgetAccounts().then((res) => {
			if (res?.success) {
				const total = (res.data ?? []).reduce(
					(sum: number, acc: { balance: number }) => sum + (acc.balance ?? 0),
					0,
				);
				setOpenDebtTotal(total);
			}
		});
	}, []);

	const activeOrderCount = useMemo(
		() => orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
		[orders],
	);

	const pendingOrderCount = useMemo(
		() => orders.filter((o) => o.status === "pending").length,
		[orders],
	);

	const newThisMonthCount = useMemo(() => {
		const startOfMonth = new Date();
		startOfMonth.setDate(1);
		startOfMonth.setHours(0, 0, 0, 0);
		const cutoff = startOfMonth.getTime();
		return clients.filter((c) => (c.createdDate ?? 0) >= cutoff).length;
	}, [clients]);

	const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

	const topCustomers = useMemo(() => {
		const revenueByOrg = new Map<string, { name: string; total: number }>();
		for (const o of orders) {
			if (!o.organizationId) continue;
			const name =
				o.client?.companyName ??
				o.client?.displayName ??
				o.organizationId;
			const existing = revenueByOrg.get(o.organizationId);
			if (existing) {
				existing.total += o.cart?.cartTotal ?? 0;
			} else {
				revenueByOrg.set(o.organizationId, { name, total: o.cart?.cartTotal ?? 0 });
			}
		}
		return Array.from(revenueByOrg.values())
			.sort((a, b) => b.total - a.total)
			.slice(0, 5);
	}, [orders]);

	const debtDisplay =
		openDebtTotal === null ? "—" : "₪" + openDebtTotal.toLocaleString("he-IL");

	const newClientsText =
		newThisMonthCount > 0
			? `↗ +${newThisMonthCount} חדשים החודש`
			: "החודש הצטרפו 0";

	return (
		<div className="space-y-5">
			{/* KPI cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				{/* Monthly revenue — MOCK */}
				<MockKpiCard
					label="הכנסות החודש"
					value="₪48,250"
					trend="↗ +14% מהחודש שעבר"
					tone="up"
					icon="lucide:banknote"
					color="var(--accent)"
				/>

				{/* Active orders — REAL */}
				<KpiCard
					label="הזמנות פעילות"
					value={orders.length === 0 ? "—" : String(activeOrderCount)}
					trend={`${pendingOrderCount} ממתינות לאישור`}
					tone="flat"
					icon="lucide:shopping-cart"
					color="var(--brand-secondary)"
				/>

				{/* Active customers — REAL */}
				<KpiCard
					label="סך הלקוחות"
					value={clients.length === 0 ? "—" : String(clients.length)}
					trend={newClientsText}
					tone="up"
					icon="lucide:users"
					color="var(--info)"
				/>

				{/* Open debt — REAL value, MOCK sub-trend */}
				<KpiCard
					label="חוב פתוח"
					value={debtDisplay}
					trend="↘ ₪3,200 גובו השבוע"
					trendMock
					tone="down"
					icon="lucide:clock"
					color="var(--warning)"
				/>
			</div>

			{/* Recent orders + low stock */}
			<div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
				{/* Recent orders — REAL */}
				<CardBlock
					title="5 הזמנות אחרונות"
					action={<ViewAllLink to="admin.orders">צפה בכולן ←</ViewAllLink>}
				>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="bg-[var(--background)] text-[var(--muted)]">
								<tr>
									{["מס' הזמנה", "חברה", "תאריך", "סכום", "סטטוס"].map((h) => (
										<th
											key={h}
											className="px-4 py-3 text-start text-[11px] font-bold uppercase tracking-wide whitespace-nowrap"
										>
											{h}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{recentOrders.length === 0 ? (
									<tr>
										<td colSpan={5} className="px-4 py-6 text-center text-[var(--muted)]">
											אין הזמנות
										</td>
									</tr>
								) : (
									recentOrders.map((o) => {
										const statusEntry = STATUS[o.status] ?? {
											color: "default" as ChipProps["color"],
											label: o.status,
										};
										const company =
											o.client?.companyName ??
											o.client?.displayName ??
											"—";
										const dateStr = o.date ? formatDayMonth(o.date) : "—";
										const amount =
											o.cart?.cartTotal != null
												? "₪" + o.cart.cartTotal.toLocaleString("he-IL")
												: "—";
										return (
											<tr
												key={o.id}
												className="border-t border-[var(--border)] hover:bg-[var(--background)] transition-colors"
											>
												<td className="px-4 py-3 font-semibold text-[var(--foreground)] whitespace-nowrap">
													{o.id.slice(0, 6)}
												</td>
												<td className="px-4 py-3 text-[var(--foreground)] whitespace-nowrap">
													{company}
												</td>
												<td className="px-4 py-3 text-[var(--muted)] whitespace-nowrap">
													{dateStr}
												</td>
												<td className="px-4 py-3 font-bold text-[var(--foreground)] whitespace-nowrap">
													{amount}
												</td>
												<td className="px-4 py-3">
													<Chip size="sm" variant="soft" color={statusEntry.color}>
														<Chip.Label>{statusEntry.label}</Chip.Label>
													</Chip>
												</td>
											</tr>
										);
									})
								)}
							</tbody>
						</table>
					</div>
				</CardBlock>

				{/* Low stock — MOCK */}
				<CardBlock
					title="מוצרים במלאי קטן"
					titleBadge={
						<Chip size="sm" variant="soft" color="warning">
							<Chip.Label>MOCK</Chip.Label>
						</Chip>
					}
					action={<ViewAllLink to="admin.products">לניהול מלאי ←</ViewAllLink>}
				>
					<div className="divide-y divide-[var(--border)]">
						{LOW_STOCK.map((p) => (
							<div key={p.name} className="flex items-center justify-between gap-3 px-5 py-3">
								<span className="text-sm text-[var(--foreground)]">{p.name}</span>
								<span
									className="text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap"
									style={{ backgroundColor: softBg("var(--warning)", 16), color: "var(--warning)" }}
								>
									{p.left}
								</span>
							</div>
						))}
					</div>
				</CardBlock>
			</div>

			{/* Top customers — REAL */}
			<CardBlock title="טופ 5 לקוחות (סך הכנסות מצטבר)">
				<div className="divide-y divide-[var(--border)]">
					{topCustomers.length === 0 ? (
						<p className="px-5 py-6 text-sm text-center text-[var(--muted)]">אין נתונים</p>
					) : (
						topCustomers.map((c, i) => (
							<div key={c.name} className="flex items-center gap-3 px-5 py-3">
								<span
									className="grid place-items-center size-7 rounded-full text-xs font-bold shrink-0"
									style={{ backgroundColor: softBg("var(--accent)"), color: "var(--accent)" }}
								>
									{i + 1}
								</span>
								<span className="flex-1 text-sm text-[var(--foreground)]">{c.name}</span>
								<span className="text-sm font-bold text-[var(--foreground)] whitespace-nowrap">
									{formatRevenue(c.total)}
								</span>
							</div>
						))
					)}
				</div>
			</CardBlock>
		</div>
	);
}

export default AdminHomePage;
