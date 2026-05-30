/**
 * Storefront trending strip (tester dev-preview) — UI-only port of the new
 * Balasi design (index.html §trending-strip). Static/illustrative cards,
 * theme tokens only, no data wiring.
 */

import { navigate } from "src/navigation";

const ORANGE = "var(--brand-secondary)"; // design --pop (#e8804a)

type TrendingItem = {
	rank: number;
	emoji: string;
	name: string;
	cat: string;
	price: string;
};

const ITEMS: TrendingItem[] = [
	{ rank: 1, emoji: "☕", name: "קפסולות נספרסו אינטנסו", cat: "קפה ושתייה חמה", price: "₪84" },
	{ rank: 2, emoji: "💧", name: "מים מינרליים 1.5L ×6", cat: "משקאות", price: "₪22" },
	{ rank: 3, emoji: "🍫", name: "שוקולד עם קרמל פרמיום", cat: "חטיפים ומתוקים", price: "₪38" },
	{ rank: 4, emoji: "🧼", name: "סבון ידיים נוזלי × 3", cat: "ניקיון ותחזוקה", price: "₪55" },
	{ rank: 5, emoji: "🥤", name: "קולה זירו 500ml × 24", cat: "משקאות", price: "₪110" },
	{ rank: 6, emoji: "🍎", name: "סל פירות עונתי", cat: "פירות וירקות", price: "₪120" },
];

const RANK_GRADIENTS: Record<number, string> = {
	1: "linear-gradient(135deg,#d4a217,#9a6f1d)",
	2: "linear-gradient(135deg,#aaa,#666)",
	3: "linear-gradient(135deg,#cd7f32,#8b4513)",
};

function TrendingCard({ item }: { item: TrendingItem }) {
	const rankBg = RANK_GRADIENTS[item.rank] ?? "var(--foreground)";
	return (
		<a
			href="#products"
			className="flex flex-shrink-0 flex-col overflow-hidden rounded-sm border border-[var(--border)] bg-[var(--surface)] p-[18px_18px_16px] transition-all duration-[250ms] hover:-translate-y-1 hover:border-[var(--foreground)] hover:shadow-[0_12px_32px_rgba(26,26,23,0.10)]"
			style={{ width: "220px", position: "relative" }}
		>
			{/* Rank badge */}
			<span
				className="absolute top-3.5 end-3.5 flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-black leading-none text-white"
				style={{ background: rankBg }}
				aria-label={`מקום ${item.rank}`}
			>
				{item.rank}
			</span>

			<div className="mb-3.5 text-center text-[64px] leading-none">{item.emoji}</div>

			<div
				className="mb-1 line-clamp-2 text-[14px] font-bold leading-tight tracking-tight text-[var(--foreground)]"
				style={{ minHeight: "2.7em" }}
			>
				{item.name}
			</div>
			<div className="mb-3 text-[11px] font-semibold text-[var(--muted)]">{item.cat}</div>

			<div className="flex items-center justify-between gap-2.5 border-t border-[var(--border)] pt-3">
				<span className="text-[20px] font-black leading-none tracking-tight text-[var(--foreground)]">
					{item.price}
				</span>
				<span
					className="text-[10px] font-bold uppercase tracking-[0.14em]"
					style={{ color: ORANGE }}
				>
					הוסף לסל
				</span>
			</div>
		</a>
	);
}

export default function TrendingStrip() {
	return (
		<section
			className="py-16"
			style={{ background: "linear-gradient(180deg, transparent 0%, var(--color-section-alt) 100%)" }}
		>
			<div className="container mx-auto px-4">
				{/* Head */}
				<div className="mb-7 flex flex-wrap items-end justify-between gap-3.5">
					<div>
						<div
							className="mb-2 block text-[11.5px] font-extrabold uppercase tracking-[0.14em]"
							style={{ color: ORANGE }}
						>
							🔥 פופולרי השבוע
						</div>
						<h2
							className="text-[clamp(28px,3.6vw,44px)] font-extrabold leading-tight tracking-tight text-[var(--foreground)]"
						>
							המוצרים שמשרדים מזמינים הכי הרבה
						</h2>
					</div>
					<a
						href="#products"
						onClick={(e) => { e.preventDefault(); navigate({ to: "store.catalog" }); }}
						className="inline-flex items-center gap-2 border-b-[1.5px] border-[var(--foreground)] pb-0.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--foreground)] transition hover:border-[var(--brand-secondary)] hover:text-[var(--brand-secondary)]"
					>
						לקטלוג המלא ←
					</a>
				</div>

				{/* Rail */}
				<div className="flex gap-[18px] overflow-x-auto pb-6 [scrollbar-width:thin]" style={{ scrollBehavior: "smooth" }}>
					{ITEMS.map((item) => (
						<TrendingCard key={item.rank} item={item} />
					))}
				</div>
			</div>
		</section>
	);
}
