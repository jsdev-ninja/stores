/**
 * Catalog sidebar for the Balasi storefront.
 *
 * - "קטגוריות"       → real CategoryMenu (Algolia-filtered)
 * - "תזונה וכשרות"   → STATIC placeholder — no such filter data in the backend
 * - "יצרנים"         → STATIC placeholder — no such filter data in the backend
 * - Help promo card  → mailto link (static)
 *
 * On mobile the aside slides in as a drawer when isOpen=true; on md+ it is
 * a sticky column.
 */

import { CategoryMenu } from "src/widgets/CategoryMenu/CategoryMenu";

// Theme tokens
const ORANGE = "var(--brand-secondary)";
const SERIF = "var(--font-serif)";

// Static placeholder diet/kosher items — UI only
const DIET_OPTIONS = [
	"כשר למהדרין",
	"כשר רגיל",
	"חלבי",
	"פרווה",
	"בשרי",
	"טבעוני",
	"צמחוני",
	"ללא גלוטן",
];

// Static placeholder brand items — UI only
const BRAND_OPTIONS = ["נסטלה", "תנובה", "עלית", "שטראוס", "יוניליוור", "PnG", "נספרסו", "טרה"];

type CatalogAsideProps = {
	isOpen: boolean;
	onClose: () => void;
};

export function CatalogAside({ isOpen, onClose }: CatalogAsideProps) {
	return (
		<>
			{/* Mobile overlay backdrop */}
			{isOpen && (
				<div
					className="md:hidden fixed inset-0 bg-black/40 z-40"
					onClick={onClose}
					aria-hidden
				/>
			)}

			{/* Aside panel */}
			<aside
				className={[
					// Desktop: sticky column, always visible
					"hidden md:flex",
					"md:w-60 lg:w-64 shrink-0 flex-col gap-6",
					"sticky top-[90px] self-start",
					// Mobile: fixed drawer
					"max-md:fixed max-md:inset-y-0 max-md:right-0 max-md:z-50 max-md:w-72",
					"max-md:flex max-md:flex-col max-md:gap-6 max-md:overflow-y-auto",
					"max-md:bg-[var(--surface)] max-md:p-5 max-md:shadow-xl",
					"max-md:transition-transform max-md:duration-300",
					isOpen ? "max-md:translate-x-0" : "max-md:translate-x-full",
				].join(" ")}
				aria-label="סינון מוצרים"
			>
				{/* Mobile close button */}
				<button
					className="md:hidden self-start p-1.5 rounded-full bg-[var(--default)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--surface)] transition-colors"
					onClick={onClose}
					aria-label="סגור"
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<path d="M18 6L6 18M6 6l12 12" />
					</svg>
				</button>

				{/* ── קטגוריות — REAL CategoryMenu ─────────────────── */}
				<div>
					<h4
						className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--foreground)] mb-2.5 pb-2.5 border-b-[1.5px] border-[var(--foreground)]"
					>
						קטגוריות
					</h4>
					<CategoryMenu />
				</div>

				{/* ── תזונה וכשרות — STATIC placeholder ───────────── */}
				{/* TODO: wire to a real dietary/kosher filter when available */}
				<div>
					<h4
						className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--foreground)] mb-2.5 pb-2.5 border-b-[1.5px] border-[var(--foreground)]"
					>
						תזונה וכשרות
					</h4>
					<div className="flex flex-col">
						{DIET_OPTIONS.map((opt) => (
							<button
								key={opt}
								disabled
								className="flex justify-between items-center py-2.5 text-[13px] font-medium text-[var(--muted)] border-b border-[var(--separator)] cursor-not-allowed opacity-60 text-right"
							>
								<span>{opt}</span>
							</button>
						))}
					</div>
				</div>

				{/* ── יצרנים — STATIC placeholder ──────────────────── */}
				{/* TODO: wire to real brand/manufacturer filter when available */}
				<div>
					<h4
						className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--foreground)] mb-2.5 pb-2.5 border-b-[1.5px] border-[var(--foreground)]"
					>
						יצרנים
					</h4>
					<div className="flex flex-col max-h-64 overflow-y-auto">
						{BRAND_OPTIONS.map((brand) => (
							<button
								key={brand}
								disabled
								className="flex justify-between items-center py-2.5 text-[13px] font-medium text-[var(--muted)] border-b border-[var(--separator)] cursor-not-allowed opacity-60 text-right"
							>
								<span>{brand}</span>
							</button>
						))}
					</div>
				</div>

				{/* ── Help promo card ────────────────────────────────── */}
				<div
					className="flex flex-col gap-1.5 p-[22px] mt-2"
					style={{ background: "var(--foreground)", color: "var(--surface)" }}
				>
					<span
						className="text-[9.5px] font-bold uppercase tracking-[0.18em]"
						style={{ color: ORANGE }}
					>
						צריכים עזרה?
					</span>
					<p
						className="text-[13px] leading-relaxed my-1.5"
						style={{ color: "rgba(247,244,238,0.80)" }}
					>
						שירות לקוחות זמין במייל לכל שאלה או הזמנה מיוחדת
					</p>
					<a
						href="mailto:balasistore5@gmail.com"
						className="text-[14px] font-extrabold pb-0.5 w-fit transition-colors"
						style={{
							fontFamily: SERIF,
							color: "var(--surface)",
							borderBottom: `1.5px solid ${ORANGE}`,
						}}
					>
						balasistore5@gmail.com ←
					</a>
				</div>
			</aside>
		</>
	);
}
