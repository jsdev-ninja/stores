/**
 * Storefront brand story — UI-only port of the new Balasi
 * design (index.html §story, dark section). Static copy, theme tokens only.
 */

const ORANGE = "var(--brand-secondary)"; // design --pop
const SERIF = "var(--font-serif)";

const QUAD = [
	{ no: "01", title: "איכות", desc: "רק מותגים מובילים ומוצרים טריים" },
	{ no: "02", title: "מחיר הוגן ושקוף", desc: "חיסכון של עד 30%" },
	{ no: "03", title: "שירות", desc: "מנהל תיק אישי לכל לקוח" },
	{ no: "04", title: "מגוון", desc: "בריאות וטבעוני בקטגוריה ייעודית" },
];

export default function Story() {
	return (
		<section id="story" className="py-20 text-[var(--surface)] lg:py-28" style={{ background: "var(--foreground)" }}>
			<div className="container mx-auto px-4">
				<div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
					{/* Left — copy */}
					<div>
						<div
							className="mb-5 inline-flex items-center gap-3.5 text-[11px] font-bold uppercase tracking-[0.18em]"
							style={{ color: `color-mix(in oklab, ${ORANGE} 70%, white)` }}
						>
							<span className="h-px w-6" style={{ background: ORANGE }} />
							הסיפור שלנו
						</div>
						<h2 className="mb-7 mt-3.5 text-[clamp(36px,4.8vw,72px)] font-extrabold leading-none tracking-tight text-[var(--surface)]">
							אספקה למשרדים
							<br />
							<em className="font-light italic" style={{ fontFamily: SERIF, color: ORANGE }}>
								בלי כאב ראש.
							</em>
						</h2>
						<p className="mb-4 max-w-[480px] text-[15px] leading-relaxed text-white/70">
							בלסי סטור בע״מ היא חברת אספקה למשרדים במרכז הארץ. אנחנו עובדים ישירות מול היצרנים
							והיבואנים — כדי שתקבלו את המוצרים הכי טובים, במחירים הכי טובים, בהזמנה אחת ובמשלוח אחד
							מסודר.
						</p>
						<p className="max-w-[480px] text-[15px] leading-relaxed text-white/70">
							הפילוסופיה שלנו פשוטה: לחסוך לכם זמן וכסף, לשמור על איכות בלתי מתפשרת, ולהעניק שירות
							אישי שמכיר אתכם בשם.
						</p>
					</div>

					{/* Right — 2×2 quad */}
					<div className="grid grid-cols-2 gap-px" style={{ background: "rgba(255,255,255,0.1)" }}>
						{QUAD.map((q) => (
							<div
								key={q.no}
								className="flex flex-col gap-2.5 p-7 transition-colors hover:bg-white/[0.03]"
								style={{ background: "var(--foreground)" }}
							>
								<span className="text-[13px] font-light italic" style={{ fontFamily: SERIF, color: ORANGE }}>
									{q.no}
								</span>
								<h4 className="text-[24px] font-extrabold tracking-tight text-[var(--surface)]">{q.title}</h4>
								<p className="text-[13px] leading-relaxed text-white/60">{q.desc}</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
