import { Chip, ChipProps } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Link } from "src/navigation";

/* -------------------------------------------------------------------------
 * MOCK DATA — visual migration of the Balasi admin dashboard.
 * Replace with real data wiring (orders / products / customers) later.
 * ---------------------------------------------------------------------- */

type Tone = "up" | "down" | "flat";

const TONE_COLOR: Record<Tone, string> = {
	up: "var(--accent)",
	down: "var(--brand-secondary)",
	flat: "var(--muted)",
};

const KPIS: {
	label: string;
	value: string;
	trend: string;
	tone: Tone;
	icon: string;
	color: string;
}[] = [
	{
		label: "הכנסות החודש",
		value: "₪48,250",
		trend: "↗ +14% מהחודש שעבר",
		tone: "up",
		icon: "lucide:banknote",
		color: "var(--accent)",
	},
	{
		label: "הזמנות פעילות",
		value: "23",
		trend: "3 ממתינות לאישור",
		tone: "flat",
		icon: "lucide:shopping-cart",
		color: "var(--brand-secondary)",
	},
	{
		label: "לקוחות פעילים",
		value: "156",
		trend: "↗ +5 חדשים החודש",
		tone: "up",
		icon: "lucide:users",
		color: "var(--info)",
	},
	{
		label: "חוב פתוח",
		value: "₪12,400",
		trend: "↘ ₪3,200 גובו השבוע",
		tone: "down",
		icon: "lucide:clock",
		color: "var(--warning)",
	},
];

const STATUS: Record<string, { color: ChipProps["color"]; label: string }> = {
	pending: { color: "default", label: "ממתין לאישור" },
	processing: { color: "accent", label: "בטיפול" },
	delivered: { color: "accent", label: "נמסר" },
	completed: { color: "success", label: "הושלם" },
	cancelled: { color: "danger", label: "בוטל" },
};

const RECENT_ORDERS: {
	id: string;
	company: string;
	date: string;
	amount: string;
	status: keyof typeof STATUS;
}[] = [
	{ id: "#1042", company: "מאפיית הבוקר", date: "30/05", amount: "₪1,240", status: "pending" },
	{ id: "#1041", company: "קפה נמרוד", date: "29/05", amount: "₪860", status: "processing" },
	{ id: "#1040", company: "מסעדת הגליל", date: "29/05", amount: "₪3,150", status: "delivered" },
	{ id: "#1039", company: "פיצה רומא", date: "28/05", amount: "₪540", status: "completed" },
	{ id: "#1038", company: "בית קפה אלגרו", date: "27/05", amount: "₪1,890", status: "cancelled" },
];

const LOW_STOCK: { name: string; left: string }[] = [
	{ name: 'קפה שחור טחון 1 ק"ג', left: "4 יח'" },
	{ name: "חלב סויה 1 ל'", left: "7 יח'" },
	{ name: "סוכר חום 500 גר'", left: "9 יח'" },
	{ name: "מפיות נייר (50)", left: "12 יח'" },
];

const TOP_CUSTOMERS: { name: string; revenue: string }[] = [
	{ name: "מסעדת הגליל", revenue: "₪14,200" },
	{ name: "קפה נמרוד", revenue: "₪11,850" },
	{ name: "מאפיית הבוקר", revenue: "₪9,400" },
	{ name: "בית קפה אלגרו", revenue: "₪7,720" },
	{ name: "פיצה רומא", revenue: "₪6,310" },
];

/* ----------------------------- pieces ----------------------------------- */

function softBg(color: string, pct = 14) {
	return `color-mix(in oklab, ${color} ${pct}%, transparent)`;
}

function KpiCard({ label, value, trend, tone, icon, color }: (typeof KPIS)[number]) {
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
				</span>
			</div>
		</div>
	);
}

function CardBlock({
	title,
	action,
	children,
}: {
	title: string;
	action?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
			<div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border)]">
				<h3 className="text-base font-extrabold tracking-tight text-[var(--foreground)]">{title}</h3>
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

/* ----------------------------- page ------------------------------------- */

function AdminHomePage() {
	return (
		<div className="space-y-5">
			{/* KPI cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				{KPIS.map((kpi) => (
					<KpiCard key={kpi.label} {...kpi} />
				))}
			</div>

			{/* Recent orders + low stock */}
			<div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
				<CardBlock
					title="הזמנות אחרונות"
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
								{RECENT_ORDERS.map((o) => (
									<tr
										key={o.id}
										className="border-t border-[var(--border)] hover:bg-[var(--background)] transition-colors"
									>
										<td className="px-4 py-3 font-semibold text-[var(--foreground)] whitespace-nowrap">
											{o.id}
										</td>
										<td className="px-4 py-3 text-[var(--foreground)] whitespace-nowrap">
											{o.company}
										</td>
										<td className="px-4 py-3 text-[var(--muted)] whitespace-nowrap">{o.date}</td>
										<td className="px-4 py-3 font-bold text-[var(--foreground)] whitespace-nowrap">
											{o.amount}
										</td>
										<td className="px-4 py-3">
											<Chip size="sm" variant="soft" color={STATUS[o.status].color}>
												<Chip.Label>{STATUS[o.status].label}</Chip.Label>
											</Chip>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</CardBlock>

				<CardBlock
					title="מוצרים במלאי קטן"
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

			{/* Top customers */}
			<CardBlock title="טופ 5 לקוחות (לפי הכנסות)">
				<div className="divide-y divide-[var(--border)]">
					{TOP_CUSTOMERS.map((c, i) => (
						<div key={c.name} className="flex items-center gap-3 px-5 py-3">
							<span
								className="grid place-items-center size-7 rounded-full text-xs font-bold shrink-0"
								style={{ backgroundColor: softBg("var(--accent)"), color: "var(--accent)" }}
							>
								{i + 1}
							</span>
							<span className="flex-1 text-sm text-[var(--foreground)]">{c.name}</span>
							<span className="text-sm font-bold text-[var(--foreground)] whitespace-nowrap">
								{c.revenue}
							</span>
						</div>
					))}
				</div>
			</CardBlock>
		</div>
	);
}

export default AdminHomePage;
