/**
 * Row header for the catalog — section tag, serif title, sort select.
 * Sort is LOCAL/UI-ONLY: the options match the design but no Algolia custom
 * ranking is wired.  A future task can connect this to InstantSearch's
 * `useSortBy` hook when the backend indices are configured.
 */

// Theme tokens
const ORANGE = "var(--brand-secondary)";
const SERIF = "var(--font-serif)";

export function CatalogRowHead() {
	return (
		<div className="flex flex-wrap items-end justify-between gap-8 mb-12">
			{/* Title block */}
			<div>
				<div
					className="mb-5 inline-flex items-center gap-3.5 text-[11px] font-bold uppercase tracking-[0.18em]"
					style={{ color: ORANGE }}
				>
					<span className="h-px w-6 block" style={{ background: ORANGE }} aria-hidden />
					הקטלוג המלא
				</div>
				<h2
					className="text-[clamp(34px,4.6vw,68px)] font-extrabold leading-none tracking-tight text-[var(--foreground)]"
				>
					כל המוצרים{" "}
					<em
						className="font-light italic"
						style={{ fontFamily: SERIF, color: ORANGE }}
					>
						שלנו.
					</em>
				</h2>
			</div>

			{/* Sort select — UI-only, no backend wiring */}
			{/* TODO: wire to Algolia useSortBy when custom ranking indices are ready */}
			<div className="flex items-center gap-3">
				<label
					htmlFor="catalog-sort"
					className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)] hidden sm:block"
				>
					מיון
				</label>
				<select
					id="catalog-sort"
					className="px-[18px] py-[11px] border-[1.5px] border-[var(--border)] bg-[var(--surface)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground)] outline-none cursor-pointer transition-colors hover:border-[var(--foreground)] focus:border-[var(--accent)]"
					defaultValue="alpha"
					aria-label="מיון מוצרים"
				>
					<option value="alpha">מיון: א-ת</option>
					<option value="alpha-desc">מיון: ת-א</option>
					<option value="price-asc">מחיר: נמוך לגבוה</option>
					<option value="price-desc">מחיר: גבוה לנמוך</option>
					<option value="popular">פופולריות</option>
				</select>
			</div>
		</div>
	);
}
