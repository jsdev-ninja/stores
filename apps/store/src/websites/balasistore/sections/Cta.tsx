/**
 * Storefront closing CTA band — UI-only port of the new
 * Balasi design (index.html §cta). Static, theme tokens only.
 */

import { navigate } from "src/navigation";

const ORANGE = "var(--brand-secondary)"; // design --pop
const SERIF = "var(--font-serif)";

export default function Cta() {
	return (
		<section
			className="relative overflow-hidden py-[140px] text-center text-white"
			style={{ background: "var(--foreground)" }}
		>
			{/* Hatching texture overlay */}
			<span
				className="pointer-events-none absolute inset-0"
				style={{
					backgroundImage: "repeating-linear-gradient(45deg,rgba(247,244,238,.02) 0,rgba(247,244,238,.02) 1px,transparent 1px,transparent 14px)",
				}}
				aria-hidden
			/>

			<div className="relative z-10 mx-auto max-w-[680px] px-4">
				<h2 className="text-[clamp(40px,5.6vw,80px)] font-black leading-[0.95] tracking-[-0.04em] text-white">
					מוכנים{" "}
					<em className="font-light italic" style={{ fontFamily: SERIF, color: ORANGE }}>
						להתחיל?
					</em>
				</h2>
				<p className="mx-auto mt-6 mb-9 max-w-[500px] text-[16px] font-normal leading-[1.6] text-white/70">
					גלו את הקטלוג המלא, הוסיפו מוצרים לסל, ובצעו הזמנה ראשונה תוך 5 דקות.
				</p>
				<a
					href="#products"
					onClick={(e) => { e.preventDefault(); navigate({ to: "store.catalog" }); }}
					className="inline-flex items-center gap-3 border-[1.5px] border-[var(--brand-secondary)] bg-[var(--brand-secondary)] px-8 py-4 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-all duration-[250ms] hover:border-white hover:bg-white hover:text-[var(--foreground)]"
				>
					התחילו להזמין
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
						<path d="M5 12h14M12 5l7 7-7 7" />
					</svg>
				</a>
			</div>
		</section>
	);
}
