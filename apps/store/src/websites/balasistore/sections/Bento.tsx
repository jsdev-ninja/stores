/**
 * Storefront bento banners — UI-only port of the new
 * Balasi design (index.html §bento). Static promo banners, theme tokens only.
 */

import { navigate } from "src/navigation";

const ORANGE = "var(--brand-secondary)"; // design --pop
const SERIF = "var(--font-serif)";

export default function Bento() {
	return (
		<section
			className="py-[70px_0_90px] relative"
			style={{
				padding: "70px 0 90px",
				background: [
					"radial-gradient(circle at 8% 15%, color-mix(in oklab, var(--brand-secondary) 18%, transparent) 0%, transparent 38%)",
					"radial-gradient(circle at 95% 90%, color-mix(in oklab, var(--accent) 14%, transparent) 0%, transparent 40%)",
					"linear-gradient(180deg, var(--background) 0%, var(--surface) 100%)",
				].join(", "),
			}}
		>
			<div className="container mx-auto px-4">
				{/* Section tag */}
				<div
					className="mb-6 inline-flex items-center gap-3.5 text-[11px] font-bold uppercase tracking-[0.18em]"
					style={{ color: ORANGE }}
				>
					<span className="h-px w-6" style={{ background: ORANGE }} />
					מה חדש
				</div>

				{/* Bento grid: large left + 2 stacked right */}
				<div
					className="grid gap-3.5"
					style={{
						gridTemplateColumns: "1.4fr 1fr",
						gridTemplateRows: "1fr 1fr",
						minHeight: "540px",
					}}
				>
					{/* Large — green, row-span 2 */}
					<a
						href="#products" onClick={(e) => { e.preventDefault(); navigate({ to: "store.catalog" }); }}
						className="relative col-start-1 row-start-1 row-end-3 flex cursor-pointer flex-col justify-between overflow-hidden rounded-[10px] p-10 transition-all duration-[400ms] hover:-translate-y-1"
						style={{ background: "var(--accent)", color: "white" }}
					>
						{/* Decorative circles */}
						<span
							className="pointer-events-none absolute"
							style={{
								top: "-160px", insetInlineStart: "-100px",
								width: "420px", height: "420px", borderRadius: "50%",
								background: "rgba(13,13,11,0.08)",
							}}
							aria-hidden
						/>
						<span
							className="pointer-events-none absolute"
							style={{
								bottom: "-60px", insetInlineEnd: "-60px",
								width: "200px", height: "200px", borderRadius: "50%",
								border: "1.5px solid rgba(247,244,238,0.25)",
							}}
							aria-hidden
						/>

						<div className="relative z-10">
							<span
								className="mb-6 block text-[13px] font-light uppercase tracking-[0.08em]"
								style={{ fontFamily: SERIF, fontStyle: "italic", color: "rgba(247,244,238,0.85)" }}
							>
								N°01 — טרי כל יום
							</span>
							<h3
								className="mb-4 text-[clamp(28px,4vw,52px)] font-black leading-[0.95] tracking-[-0.04em] text-white"
							>
								ויטמינים,<br />
								<em className="font-light italic" style={{ fontFamily: SERIF }}>ישר לעבודה.</em>
							</h3>
							<p className="mb-7 max-w-[300px] text-[14px] leading-[1.55] text-white/85">
								פינת פירות וירקות טרייה במשרד שלכם — אנחנו דואגים לאספקה, אתם נהנים מהטריות.
							</p>
							<span className="inline-flex items-center gap-2 border-b-[1.5px] border-white/60 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition hover:border-white">
								לקטלוג ←
							</span>
						</div>

						{/* Big glyph decoration */}
						<div
							className="pointer-events-none absolute bottom-5 start-[30px] z-10 font-black text-black/10 leading-[0.85] tracking-[-0.06em] select-none"
							style={{ fontSize: "200px" }}
							aria-hidden
						>
							טרי
						</div>
					</a>

					{/* Orange — recurring order */}
					<a
						href="#products" onClick={(e) => { e.preventDefault(); navigate({ to: "store.catalog" }); }}
						className="relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-[10px] p-10 transition-all duration-[400ms] hover:-translate-y-1"
						style={{ background: ORANGE, color: "white" }}
					>
						<span
							className="pointer-events-none absolute"
							style={{
								bottom: "-50px", insetInlineStart: "-50px",
								width: "200px", height: "200px", borderRadius: "50%",
								border: "1.5px solid rgba(247,244,238,0.25)",
							}}
							aria-hidden
						/>
						{/* Mini cards decoration */}
						<div
							className="pointer-events-none absolute top-[25%] end-6 z-10 flex flex-col gap-2"
							aria-hidden
						>
							{[
								{ emoji: "☕", rotate: "-7deg", bg: "var(--foreground)" },
								{ emoji: "🥐", rotate: "5deg", bg: ORANGE },
								{ emoji: "🍫", rotate: "-3deg", bg: "var(--foreground)" },
							].map((mc, i) => (
								<div
									key={i}
									className="flex h-[78px] w-[60px] items-center justify-center rounded-lg text-[28px]"
									style={{ background: mc.bg, transform: `rotate(${mc.rotate})` }}
								>
									{mc.emoji}
								</div>
							))}
						</div>

						<div className="relative z-10">
							<span
								className="mb-6 block text-[13px] font-light uppercase tracking-[0.08em] text-white/70"
								style={{ fontFamily: SERIF, fontStyle: "italic" }}
							>
								N°02 — נוחות
							</span>
							<h3 className="mb-4 text-[clamp(28px,4vw,52px)] font-black leading-[0.95] tracking-[-0.04em] text-white">
								<em className="font-light italic text-[var(--foreground)]" style={{ fontFamily: SERIF }}>
									הזמנה קבועה
								</em>
								<br />
								שבועית.
							</h3>
							<p className="mb-7 max-w-[300px] text-[14px] leading-[1.55] text-white/85">
								הגדירו פעם — נשלח אליכם כל שבוע, אותם המוצרים, באוטומט.
							</p>
							<span className="inline-flex items-center gap-2 border-b-[1.5px] border-white/60 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
								למידע ←
							</span>
						</div>
					</a>

					{/* Dark — free shipping */}
					<a
						href="#service-areas"
						className="relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-[10px] p-10 transition-all duration-[400ms] hover:-translate-y-1"
						style={{ background: "var(--foreground)", color: "white" }}
					>
						{/* Hatching overlay */}
						<span
							className="pointer-events-none absolute inset-0 z-10"
							style={{
								backgroundImage: "repeating-linear-gradient(45deg,rgba(247,244,238,.025) 0,rgba(247,244,238,.025) 1px,transparent 1px,transparent 12px)",
							}}
							aria-hidden
						/>
						{/* Concentric circles decoration */}
						<svg
							viewBox="0 0 120 120"
							width="140"
							height="140"
							fill="none"
							stroke="currentColor"
							strokeWidth={0.7}
							className="pointer-events-none absolute end-8 top-1/2 -translate-y-1/2 opacity-70 z-10"
							style={{ color: "var(--accent)" }}
							aria-hidden
						>
							<circle cx="60" cy="60" r="50" />
							<circle cx="60" cy="60" r="38" />
							<circle cx="60" cy="60" r="26" />
							<circle cx="60" cy="60" r="14" />
						</svg>

						<div className="relative z-20">
							<span
								className="mb-6 block text-[13px] font-light uppercase tracking-[0.08em]"
								style={{ fontFamily: SERIF, fontStyle: "italic", color: "color-mix(in oklab, var(--accent) 70%, white)" }}
							>
								N°03 — שירות מקצה לקצה
							</span>
							<h3 className="mb-4 text-[clamp(28px,4vw,52px)] font-black leading-[0.95] tracking-[-0.04em] text-white">
								משלוח<br />
								<em className="font-light italic text-[var(--accent)]" style={{ fontFamily: SERIF }}>
									חינם.
								</em>
							</h3>
							<p className="mb-7 max-w-[300px] text-[14px] leading-[1.55] text-white/85">
								בהזמנות מעל ₪650 — אספקה תוך 24 שעות בכל מרכז הארץ.
							</p>
							<span className="inline-flex items-center gap-2 border-b-[1.5px] border-white/40 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
								לאזורי השירות ←
							</span>
						</div>
					</a>
				</div>
			</div>
		</section>
	);
}
