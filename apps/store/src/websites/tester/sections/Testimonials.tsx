/**
 * Storefront testimonials / how-it-works (tester dev-preview) — UI-only port
 * of the new Balasi design (index.html §how-it-works). Static steps,
 * theme tokens only, no data wiring.
 */

const ORANGE = "var(--brand-secondary)"; // design --pop

type Step = {
	no: string;
	title: string;
	desc: string;
};

const STEPS: Step[] = [
	{ no: "01", title: "בוחרים מוצרים", desc: "גלישה בקטלוג, חיפוש מהיר, סל קל למילוי" },
	{ no: "02", title: "פרטי הזמנה", desc: "מספר לקוח, פרטי משלוח וחשבונית" },
	{ no: "03", title: "אישור טלפוני", desc: "נציג מאשר ומתאם משלוח" },
	{ no: "04", title: "אספקה", desc: "עד 24 שעות + חשבונית מס" },
];

export default function Testimonials() {
	return (
		<section className="py-20 lg:py-28" style={{ background: "var(--background)" }}>
			<div className="container mx-auto px-4">
				{/* Centered head */}
				<div className="mb-[60px] text-center">
					<div
						className="mb-5 inline-flex items-center justify-center gap-3.5 text-[11px] font-bold uppercase tracking-[0.18em]"
						style={{ color: ORANGE }}
					>
						<span className="h-px w-6" style={{ background: ORANGE }} />
						איך זה עובד
						<span className="h-px w-6" style={{ background: ORANGE }} />
					</div>
					<h2 className="text-center text-[clamp(34px,4.6vw,68px)] font-extrabold leading-none tracking-tight text-[var(--foreground)]">
						פשוט — מ-א&apos; ועד{" "}
						<em
							className="font-light italic"
							style={{
								fontFamily: "var(--font-serif)",
								color: ORANGE,
							}}
						>
							הדלת.
						</em>
					</h2>
				</div>

				{/* Steps grid */}
				<div
					className="grid grid-cols-2 border-t border-[var(--border)] lg:grid-cols-4"
				>
					{STEPS.map((step, i) => (
						<div
							key={step.no}
							className="border-b border-e border-[var(--border)] p-[42px_28px] transition-colors duration-300 last:border-e-0 hover:bg-[var(--surface)]"
							style={{ borderInlineEndWidth: i === STEPS.length - 1 ? 0 : undefined }}
						>
							<span
								className="mb-[18px] block text-[42px] font-black leading-none tracking-tight"
								style={{ color: ORANGE }}
							>
								{step.no}
							</span>
							<h4 className="mb-1.5 text-[20px] font-extrabold leading-tight tracking-tight text-[var(--foreground)]">
								{step.title}
							</h4>
							<p className="text-[13px] font-normal leading-[1.55] text-[var(--muted)]">
								{step.desc}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
