/**
 * Storefront monthly deals (tester dev-preview) — UI-only port of the new
 * Balasi design (index.html §monthly-deals). Static illustrative deal cards,
 * theme tokens only, no data wiring.
 */

const ORANGE = "var(--brand-secondary)"; // design --pop
const SERIF = "var(--font-serif)";

type Deal = {
	id: string;
	tag: "sale" | "new" | "bundle";
	tagLabel: string;
	emoji: string;
	cat: string;
	name: string;
	price: string;
	originalPrice?: string;
	unit: string;
};

const DEALS: Deal[] = [
	{
		id: "d1",
		tag: "sale",
		tagLabel: "מבצע",
		emoji: "☕",
		cat: "קפה ושתייה חמה",
		name: "קפסולות נספרסו ורטואו ×50",
		price: "₪149",
		originalPrice: "₪189",
		unit: "לקופסה",
	},
	{
		id: "d2",
		tag: "bundle",
		tagLabel: "חבילה",
		emoji: "🧼",
		cat: "ניקיון ותחזוקה",
		name: "חבילת ניקיון משרדית — 12 מוצרים",
		price: "₪320",
		originalPrice: "₪420",
		unit: "לחבילה",
	},
	{
		id: "d3",
		tag: "sale",
		tagLabel: "מבצע",
		emoji: "💧",
		cat: "משקאות",
		name: "מים מינרליים 0.5L × 24",
		price: "₪38",
		originalPrice: "₪52",
		unit: "לארגז",
	},
	{
		id: "d4",
		tag: "new",
		tagLabel: "חדש",
		emoji: "🥗",
		cat: "בריאות וטבעוני",
		name: "חטיפי חומוס אפוי × 12",
		price: "₪72",
		unit: "לארגז",
	},
	{
		id: "d5",
		tag: "sale",
		tagLabel: "מבצע",
		emoji: "🍫",
		cat: "חטיפים ומתוקים",
		name: "שוקולד מריר 85% × 6",
		price: "₪68",
		originalPrice: "₪90",
		unit: "לארגז",
	},
];

type CSSProps = { background: string; color: string; border?: string };

const TAG_BG: Record<Deal["tag"], CSSProps> = {
	sale: { background: ORANGE, color: "white" },
	new: { background: "var(--surface)", color: "var(--foreground)", border: "1.5px solid var(--foreground)" },
	bundle: { background: "var(--foreground)", color: "white" },
};

function DealCard({ deal }: { deal: Deal }) {
	return (
		<a
			href="#products"
			className="group relative flex flex-shrink-0 flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--foreground)] hover:shadow-[0_12px_36px_rgba(13,13,11,0.08)]"
			style={{ width: "240px", scrollSnapAlign: "start" }}
		>
			{/* Image area */}
			<div
				className="relative flex h-[200px] items-center justify-center border-b border-[var(--border)]"
				style={{ background: "linear-gradient(180deg,var(--color-section-alt),var(--surface))" }}
			>
				<span className="text-[78px] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-2">
					{deal.emoji}
				</span>
				{/* Tag badge */}
				<span
					className="absolute start-3 top-3 px-3 py-1 text-[9.5px] font-bold uppercase tracking-[0.16em]"
					style={TAG_BG[deal.tag]}
				>
					{deal.tagLabel}
				</span>
			</div>

			{/* Body */}
			<div className="flex flex-1 flex-col gap-1.5 p-[18px_18px_20px]">
				<span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: ORANGE }}>
					{deal.cat}
				</span>
				<h3 className="line-clamp-2 min-h-[38px] text-[15px] font-extrabold leading-tight tracking-tight text-[var(--foreground)]">
					{deal.name}
				</h3>
				<span className="text-[11.5px] text-[var(--muted)]">{deal.unit}</span>

				{/* Price row */}
				<div className="mt-3.5 flex items-center justify-between gap-2.5 border-t border-[var(--border)] pt-3.5">
					<div className="flex items-baseline gap-2">
						<span
							className="text-[22px] font-black leading-none tracking-tight"
							style={{ color: deal.originalPrice ? ORANGE : "var(--foreground)" }}
						>
							{deal.price}
						</span>
						{deal.originalPrice && (
							<span className="text-[13px] font-semibold text-[var(--muted)] line-through">
								{deal.originalPrice}
							</span>
						)}
					</div>
					<span
						className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-[var(--foreground)] text-white transition-all duration-300 group-hover:bg-[var(--brand-secondary)] group-hover:rotate-90"
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
							<line x1="12" y1="5" x2="12" y2="19" />
							<line x1="5" y1="12" x2="19" y2="12" />
						</svg>
					</span>
				</div>
			</div>
		</a>
	);
}

export default function MonthlyDeals() {
	return (
		<section className="py-20 lg:py-28" style={{ background: "var(--background)" }}>
			<div className="container mx-auto px-4">
				{/* Row head */}
				<div className="mb-[60px] flex flex-wrap items-end justify-between gap-7">
					<div>
						<div
							className="mb-5 inline-flex items-center gap-3.5 text-[11px] font-bold uppercase tracking-[0.18em]"
							style={{ color: ORANGE }}
						>
							<span className="h-px w-6" style={{ background: ORANGE }} />
							מבצע חודשי
						</div>
						<h2 className="text-[clamp(34px,4.6vw,68px)] font-extrabold leading-none tracking-tight text-[var(--foreground)]">
							המבצעים{" "}
							<em className="font-light italic" style={{ fontFamily: SERIF, color: ORANGE }}>
								של החודש.
							</em>
						</h2>
					</div>
					<span
						className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]"
						style={{ cursor: "default" }}
					>
						בתוקף עד סוף החודש
					</span>
				</div>

				{/* Rail with relative wrap for buttons */}
				<div className="relative px-7">
					<div
						className="flex gap-3.5 overflow-x-auto py-2 [scrollbar-width:none] [scroll-behavior:smooth] [scroll-snap-type:x_mandatory]"
						style={{ WebkitOverflowScrolling: "touch" }}
					>
						{DEALS.map((deal) => (
							<DealCard key={deal.id} deal={deal} />
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
