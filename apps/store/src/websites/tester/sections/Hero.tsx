/**
 * Storefront hero (tester dev-preview) — UI-only port of the new Balasi design
 * (migration-new-ui/balasi-all/index.html §hero). Static/illustrative content,
 * theme tokens only, no feature wiring. The "popular picks" cards on the right
 * are design content, not real catalog data.
 */

import { navigate } from "src/navigation";

const ORANGE = "var(--brand-secondary)"; // design --pop (#e8804a)
const SERIF = "var(--font-serif)";

type Pick = {
	no: string;
	emoji: string;
	tag: string;
	name: string;
	price: string;
	unit: string;
	featured?: boolean;
};

const PICKS: Pick[] = [
	{ no: "01", emoji: "☕", tag: "פריט נמכר", name: "קפסולות נספרסו", price: "₪84", unit: "לקופסה" },
	{ no: "02", emoji: "🥗", tag: "חדש בקטלוג", name: "סלי פירות טריים", price: "₪120", unit: "לסל", featured: true },
	{ no: "03", emoji: "💧", tag: "המומלץ שלנו", name: "מים מינרליים", price: "₪22", unit: "לארגז" },
];

function SmallPick({ pick, rotate }: { pick: Pick; rotate: string }) {
	return (
		<div
			className="self-center flex flex-col items-start gap-1.5 rounded-lg p-3.5 bg-[var(--surface)] text-[var(--foreground)] shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
			style={{ border: `1px solid color-mix(in oklab, ${ORANGE} 30%, transparent)`, transform: rotate }}
		>
			<span className="text-[13px] italic" style={{ fontFamily: SERIF, color: ORANGE }}>
				{pick.no}
			</span>
			<span className="self-center text-[32px] drop-shadow-[0_3px_6px_rgba(0,0,0,0.25)]">{pick.emoji}</span>
			<span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">{pick.tag}</span>
			<span className="italic text-[15px] leading-tight text-[var(--foreground)]" style={{ fontFamily: SERIF }}>
				{pick.name}
			</span>
			<div className="mt-1.5 flex w-full items-baseline justify-between gap-2 border-t border-black/10 pt-2.5">
				<span className="italic text-[21px] leading-none" style={{ fontFamily: SERIF, color: ORANGE }}>
					{pick.price}
				</span>
				<span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
					{pick.unit}
				</span>
			</div>
		</div>
	);
}

function BigPick({ pick }: { pick: Pick }) {
	const lightGreen = "color-mix(in oklab, var(--accent) 38%, #ffffff)";
	return (
		<div
			className="self-center flex flex-col items-center justify-center gap-2 rounded-lg px-4 pb-4 pt-5 text-[var(--surface)] shadow-[0_28px_60px_color-mix(in_oklab,var(--accent)_40%,transparent)]"
			style={{
				background: "linear-gradient(180deg, color-mix(in oklab, var(--foreground) 88%, #ffffff) 0%, var(--foreground) 100%)",
				border: "1px solid var(--accent)",
			}}
		>
			<div className="flex w-full items-center gap-3">
				<span className="text-[18px] italic" style={{ fontFamily: SERIF, color: lightGreen }}>
					{pick.no}
				</span>
				<span className="h-px flex-1" style={{ background: "color-mix(in oklab, var(--accent) 30%, transparent)" }} />
			</div>
			<span className="my-1 text-[54px] drop-shadow-[0_6px_12px_rgba(0,0,0,0.4)]">{pick.emoji}</span>
			<span
				className="self-center text-[11px] font-bold uppercase tracking-[0.28em]"
				style={{ color: lightGreen }}
			>
				{pick.tag}
			</span>
			<h3 className="text-center text-[24px] font-light leading-tight text-[var(--surface)]" style={{ fontFamily: SERIF }}>
				{pick.name}
			</h3>
			<div
				className="mt-auto flex w-full items-baseline gap-2 pt-3.5"
				style={{ borderTop: "1px solid color-mix(in oklab, var(--accent) 25%, transparent)" }}
			>
				<span className="text-[28px] font-light italic" style={{ fontFamily: SERIF, color: lightGreen }}>
					{pick.price}
				</span>
				<span className="flex-1 border-b border-dotted" style={{ borderColor: "color-mix(in oklab, var(--accent) 35%, transparent)" }} />
				<span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">{pick.unit}</span>
			</div>
		</div>
	);
}

export default function Hero() {
	return (
		<section
			className="relative overflow-hidden pt-20"
			style={{
				background: [
					`radial-gradient(circle at 92% -5%, color-mix(in oklab, ${ORANGE} 38%, transparent) 0%, transparent 40%)`,
					`radial-gradient(circle at 5% 105%, color-mix(in oklab, ${ORANGE} 20%, transparent) 0%, transparent 45%)`,
					`radial-gradient(circle at 50% 55%, color-mix(in oklab, var(--accent) 22%, transparent) 0%, transparent 32%)`,
					"linear-gradient(135deg, var(--color-hero, #fdfaf3) 0%, var(--background) 100%)",
				].join(", "),
			}}
		>
			<div className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 pb-16 lg:grid-cols-[0.95fr_1.05fr] lg:pb-24">
				{/* Left */}
				<div>
					<div className="mb-7 flex items-center gap-3">
						<span className="relative flex h-2.5 w-2.5">
							<span
								className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
								style={{ background: ORANGE }}
							/>
							<span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: ORANGE }} />
						</span>
						<span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: ORANGE }}>
							פעיל ברגע זה · ✓ מסירות נשלחות היום
						</span>
					</div>

					<h1
						className="font-extrabold tracking-tight text-[var(--foreground)]"
						style={{ fontSize: "clamp(48px, 8vw, 108px)", lineHeight: 0.92, letterSpacing: "-0.05em" }}
					>
						כל מה שהמשרד{" "}
						<em className="font-light not-italic" style={{ fontFamily: SERIF, fontStyle: "italic", color: ORANGE }}>
							צריך
						</em>
						,<br />
						בהזמנה{" "}
						<span className="relative inline-block font-extrabold" style={{ color: ORANGE }}>
							<span
								className="absolute inset-x-[-4%] bottom-[6%] h-[32%] -z-0 rounded"
								style={{ background: `color-mix(in oklab, ${ORANGE} 22%, transparent)`, transform: "skew(-3deg)" }}
								aria-hidden
							/>
							<span className="relative">אחת</span>
						</span>{" "}
						מסודרת.
					</h1>

					<p className="my-9 max-w-[480px] text-base leading-relaxed text-[var(--muted)]">
						קפה, חטיפים, פירות טריים, משקאות, מוצרי ניקיון וכלים חד-פעמיים —{" "}
						<b className="text-[var(--foreground)]">מותגים מובילים, משלוח עד הדלת</b>.
					</p>

					<div className="flex flex-wrap items-center gap-6">
						<a
							href="#products"
							onClick={(e) => { e.preventDefault(); navigate({ to: "store.catalog" }); }}
							className="inline-flex items-center gap-2 rounded-lg bg-[var(--foreground)] px-7 py-3.5 text-base font-bold text-[var(--surface)] shadow-[0_4px_18px_rgba(26,26,23,0.18)] transition hover:-translate-y-0.5 hover:bg-[var(--accent)]"
						>
							התחילו הזמנה עכשיו
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
								<path d="M5 12h14M12 5l7 7-7 7" />
							</svg>
						</a>
						<a href="#categories" className="text-sm font-semibold text-[var(--foreground)] hover:text-[var(--accent)]">
							דלגו לקטגוריות ↓
						</a>
					</div>

					<div className="mt-14 grid max-w-[420px] grid-cols-2 gap-6 border-t border-[var(--border)] pt-7">
						<div>
							<b className="block text-[34px] font-extrabold leading-none tracking-tight text-[var(--foreground)]">9</b>
							<span className="mt-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
								ערים בשירות
							</span>
						</div>
						<div>
							<b className="block text-[34px] font-extrabold leading-none tracking-tight" style={{ color: ORANGE }}>
								24h
							</b>
							<span className="mt-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
								אספקה לדלת
							</span>
						</div>
					</div>
				</div>

				{/* Right — dark "popular picks" frame */}
				<div
					className="relative flex flex-col gap-6 overflow-hidden rounded-2xl p-8 text-[var(--surface)]"
					style={{
						background: "radial-gradient(ellipse 80% 60% at 50% 35%, color-mix(in oklab, var(--foreground) 90%, var(--brand-secondary) 10%) 0%, var(--foreground) 80%)",
						minHeight: "min(580px, 70vw)",
					}}
				>
					<h2 className="text-[42px] font-light leading-none text-[var(--surface)]" style={{ fontFamily: SERIF }}>
						המבחר{" "}
						<em className="italic" style={{ color: ORANGE }}>
							הפופולרי
						</em>
					</h2>

					<div className="grid flex-1 grid-cols-[1fr_1.6fr_1fr] items-center gap-4">
						<SmallPick pick={PICKS[0]} rotate="rotate(-1deg)" />
						<BigPick pick={PICKS[1]} />
						<SmallPick pick={PICKS[2]} rotate="rotate(1deg)" />
					</div>
				</div>
			</div>
		</section>
	);
}
