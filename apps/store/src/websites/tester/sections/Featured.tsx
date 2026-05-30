/**
 * Storefront featured products (tester dev-preview) — UI-only port of the new
 * Balasi design (index.html §featured). Static illustrative product cards,
 * theme tokens only, no data wiring.
 */

import { navigate } from "src/navigation";

const ORANGE = "var(--brand-secondary)"; // design --pop
const SERIF = "var(--font-serif)";

type FeaturedProduct = {
	id: string;
	emoji: string;
	cat: string;
	name: string;
	price: string;
	unit: string;
	badge?: string;
};

const FEATURED: FeaturedProduct[] = [
	{
		id: "f1",
		emoji: "☕",
		cat: "קפה ושתייה חמה",
		name: "קפסולות נספרסו אינטנסו × 50",
		price: "₪84",
		unit: "לקופסה",
		badge: "פריט נמכר",
	},
	{
		id: "f2",
		emoji: "🥐",
		cat: "מאפים ובריאות",
		name: "מאפי בוקר אישיים × 12",
		price: "₪95",
		unit: "לארגז",
	},
	{
		id: "f3",
		emoji: "💧",
		cat: "משקאות",
		name: "מים מינרליים 1.5L × 6",
		price: "₪22",
		unit: "לארגז",
		badge: "המומלץ שלנו",
	},
	{
		id: "f4",
		emoji: "🍫",
		cat: "חטיפים ומתוקים",
		name: "שוקולד בלגי פרמיום × 6",
		price: "₪64",
		unit: "לארגז",
	},
	{
		id: "f5",
		emoji: "🧴",
		cat: "ניקיון ותחזוקה",
		name: "ג'ל לשטיפת ידיים × 3",
		price: "₪48",
		unit: "לחבילה",
	},
	{
		id: "f6",
		emoji: "🍎",
		cat: "פירות וירקות",
		name: "סל פירות עונתי ממובחר",
		price: "₪120",
		unit: "לסל",
		badge: "חדש",
	},
];

function FeaturedCard({ product }: { product: FeaturedProduct }) {
	return (
		<a
			href="#products"
			className="group relative flex flex-shrink-0 flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--foreground)] hover:shadow-[0_12px_36px_rgba(13,13,11,0.08)]"
			style={{ width: "240px", scrollSnapAlign: "start" }}
		>
			{/* Image */}
			<div
				className="relative flex h-[200px] items-center justify-center border-b border-[var(--border)]"
				style={{ background: "linear-gradient(180deg,var(--color-section-alt),var(--surface))" }}
			>
				<span className="text-[78px] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-2">
					{product.emoji}
				</span>
				{product.badge && (
					<span className="absolute start-3 top-3 bg-[var(--foreground)] px-3 py-1 text-[9.5px] font-bold uppercase tracking-[0.16em] text-white">
						{product.badge}
					</span>
				)}
			</div>

			{/* Body */}
			<div className="flex flex-1 flex-col gap-1.5 p-[18px_18px_20px]">
				<span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: ORANGE }}>
					{product.cat}
				</span>
				<h3 className="line-clamp-2 min-h-[38px] text-[15px] font-extrabold leading-tight tracking-tight text-[var(--foreground)]">
					{product.name}
				</h3>
				<span className="text-[11.5px] text-[var(--muted)]">{product.unit}</span>

				<div className="mt-3.5 flex items-center justify-between gap-2.5 border-t border-[var(--border)] pt-3.5">
					<span className="text-[22px] font-black leading-none tracking-tight text-[var(--foreground)]">
						{product.price}
					</span>
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

export default function Featured() {
	return (
		<section className="py-20 lg:py-28" style={{ background: "var(--color-section-alt)" }}>
			<div className="container mx-auto px-4">
				{/* Row head */}
				<div className="mb-[60px] flex flex-wrap items-end justify-between gap-7">
					<div>
						<div
							className="mb-5 inline-flex items-center gap-3.5 text-[11px] font-bold uppercase tracking-[0.18em]"
							style={{ color: ORANGE }}
						>
							<span className="h-px w-6" style={{ background: ORANGE }} />
							הפופולריים השבוע
						</div>
						<h2 className="text-[clamp(34px,4.6vw,68px)] font-extrabold leading-none tracking-tight text-[var(--foreground)]">
							המוצרים{" "}
							<em className="font-light italic" style={{ fontFamily: SERIF, color: ORANGE }}>
								האהובים
							</em>{" "}
							במשרדים.
						</h2>
					</div>
					<a
						href="#products"
						onClick={(e) => { e.preventDefault(); navigate({ to: "store.catalog" }); }}
						className="inline-flex items-center gap-2.5 border-b-[1.5px] border-[var(--foreground)] pb-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--foreground)] transition hover:border-[var(--brand-secondary)] hover:text-[var(--brand-secondary)]"
					>
						לקטלוג המלא <span className="text-[14px]">→</span>
					</a>
				</div>

				{/* Rail */}
				<div className="relative px-7">
					<div
						className="flex gap-3.5 overflow-x-auto py-2 [scrollbar-width:none] [scroll-behavior:smooth] [scroll-snap-type:x_mandatory]"
						style={{ WebkitOverflowScrolling: "touch" }}
					>
						{FEATURED.map((product) => (
							<FeaturedCard key={product.id} product={product} />
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
