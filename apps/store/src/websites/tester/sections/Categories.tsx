/**
 * Storefront categories grid (tester dev-preview) — UI-only port of the new
 * Balasi design (index.html §categories). Static/illustrative category content,
 * theme tokens only, links scroll to the catalog (#products) — no data wiring.
 */

const ORANGE = "var(--brand-secondary)"; // design --pop
const SERIF = "var(--font-serif)";

const CATS = [
	{ no: "01", icon: "☕", title: "קפה ושתייה חמה", desc: "קפסולות, פולים, תה ונלווים" },
	{ no: "02", icon: "🍫", title: "חטיפים ומתוקים", desc: "חטיפים, עוגיות ושוקולד" },
	{ no: "03", icon: "🍎", title: "פירות וירקות טריים", desc: "סלי פירות וירקות חתוכים" },
	{ no: "04", icon: "🥤", title: "משקאות", desc: "מים, מיצים, קולה ואנרגיה" },
	{ no: "05", icon: "🧼", title: "ניקיון ותחזוקה", desc: "חומרי ניקוי, נייר ומגבונים" },
	{ no: "06", icon: "🍽️", title: "כלים חד-פעמיים", desc: 'צלחות, כוסות וסכו"ם' },
	{ no: "07", icon: "🥗", title: "בריאות וטבעוני", desc: "מוצרים אורגניים וטבעוניים" },
	{ no: "08", icon: "🧴", title: "מטבח וכללי", desc: "כל מה שהמשרד צריך" },
];

export default function Categories() {
	return (
		<section id="categories" className="py-20 lg:py-28" style={{ background: "var(--color-section-alt)" }}>
			<div className="container mx-auto px-4">
				<div className="mb-12 lg:mb-16">
					<div
						className="mb-5 inline-flex items-center gap-3.5 text-[11px] font-bold uppercase tracking-[0.18em]"
						style={{ color: ORANGE }}
					>
						<span className="h-px w-6" style={{ background: ORANGE }} />
						קטגוריות
					</div>
					<h2 className="text-[clamp(34px,4.6vw,68px)] font-extrabold leading-none tracking-tight text-[var(--foreground)]">
						קטגוריות{" "}
						<em className="font-light italic" style={{ fontFamily: SERIF, color: ORANGE }}>
							לכל צורך.
						</em>
					</h2>
				</div>

				<div className="grid grid-cols-2 border-s border-t border-[var(--border)] lg:grid-cols-4">
					{CATS.map((c) => (
						<a
							key={c.no}
							href="#products"
							className="group relative flex cursor-pointer flex-col overflow-hidden border-e border-b border-[var(--border)] p-7"
						>
							<span
								className="absolute inset-0 translate-y-full bg-[var(--foreground)] transition-transform duration-300 ease-out group-hover:translate-y-0"
								aria-hidden
							/>
							<span className="relative z-10 mb-9 block text-xs italic" style={{ fontFamily: SERIF, color: ORANGE }}>
								{c.no}
							</span>
							<span className="relative z-10 mb-6 self-start text-[42px]">{c.icon}</span>
							<h3 className="relative z-10 mb-1.5 text-[22px] font-extrabold leading-tight tracking-tight text-[var(--foreground)] transition-colors group-hover:text-[var(--surface)]">
								{c.title}
							</h3>
							<p className="relative z-10 text-[12.5px] leading-relaxed text-[var(--muted)] transition-colors group-hover:text-white/80">
								{c.desc}
							</p>
							<span
								className="relative z-10 mt-auto pt-6 text-xl font-extrabold transition-transform group-hover:-translate-x-2"
								style={{ color: ORANGE }}
							>
								←
							</span>
						</a>
					))}
				</div>
			</div>
		</section>
	);
}
