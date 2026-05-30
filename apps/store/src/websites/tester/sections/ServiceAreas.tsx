/**
 * Storefront service areas (tester dev-preview) — UI-only port of the new
 * Balasi design (index.html §service-areas). Static city data, theme tokens
 * only, no data wiring.
 */

const ORANGE = "var(--brand-secondary)"; // design --pop
const SERIF = "var(--font-serif)";

type City = {
	name: string;
	min: string;
	special?: boolean;
};

const CITIES: City[] = [
	{ name: "תל אביב", min: "₪500" },
	{ name: "רמת גן", min: "₪500" },
	{ name: "פתח תקווה", min: "₪500" },
	{ name: "בני ברק", min: "₪500" },
	{ name: "גבעת שמואל", min: "₪500" },
	{ name: "גבעתיים", min: "₪500" },
	{ name: "הרצליה", min: "₪500" },
	{ name: "רמת השרון", min: "₪650", special: true },
	{ name: "הוד השרון", min: "₪650", special: true },
];

const SERVICE_INFO = [
	{ label: "מינימום הזמנה", value: "₪500 ברוב הערים · ₪650 ברמת השרון והוד השרון" },
	{ label: "זמן אספקה", value: "תוך 24 שעות ברוב הערים" },
	{ label: "משלוח חינם", value: "בהזמנות מעל ₪650" },
];

export default function ServiceAreas() {
	return (
		<section
			id="service-areas"
			className="py-20 lg:py-28"
			style={{ background: "var(--color-section-alt)" }}
		>
			<div className="container mx-auto px-4">
				<div className="grid grid-cols-1 items-start gap-20 lg:grid-cols-[1fr_1.1fr]">
					{/* Left — info */}
					<div>
						<div
							className="mb-5 inline-flex items-center gap-3.5 text-[11px] font-bold uppercase tracking-[0.18em]"
							style={{ color: ORANGE }}
						>
							<span className="h-px w-6" style={{ background: ORANGE }} />
							אזורי שירות
						</div>
						<h2 className="text-[clamp(34px,4.6vw,68px)] font-extrabold leading-none tracking-tight text-[var(--foreground)]">
							9 ערים{" "}
							<em className="font-light italic" style={{ fontFamily: SERIF, color: ORANGE }}>
								במרכז הארץ.
							</em>
						</h2>
						<p className="mt-3.5 max-w-[420px] text-[14.5px] leading-[1.7] text-[var(--muted)]">
							משלוחים סדירים, איש קשר ייעודי לכל לקוח, ושירות זהה בכל הערים.
						</p>

						{/* Info rows */}
						<div className="mt-7 flex flex-col">
							{SERVICE_INFO.map((row) => (
								<div
									key={row.label}
									className="grid gap-6 border-t border-[var(--border)] py-[18px] last:border-b"
									style={{ gridTemplateColumns: "140px 1fr" }}
								>
									<b className="text-[13.5px] font-extrabold uppercase tracking-[0.04em] text-[var(--foreground)]">
										{row.label}
									</b>
									<span className="text-[13px] font-normal leading-[1.55] text-[var(--muted)]">
										{row.value}
									</span>
								</div>
							))}
						</div>
					</div>

					{/* Right — city grid */}
					<div
						className="grid gap-px border border-[var(--border)]"
						style={{
							gridTemplateColumns: "repeat(3, 1fr)",
							background: "var(--border)",
						}}
					>
						{CITIES.map((city) => (
							<div
								key={city.name}
								className="group flex flex-col items-start gap-2 p-6 transition-colors duration-[250ms] hover:bg-[var(--foreground)] hover:text-white"
								style={{
									background: city.special ? ORANGE : "var(--surface)",
									color: city.special ? "white" : "var(--foreground)",
								}}
							>
								{/* Pin dot */}
								<span
									className="h-2 w-2 rounded-full transition-colors duration-[250ms]"
									style={{
										background: city.special ? "white" : "var(--foreground)",
									}}
								/>
								<b className="text-[17px] font-extrabold leading-tight tracking-tight">
									{city.name}
								</b>
								<span
									className="text-[9.5px] font-bold uppercase tracking-[0.16em] transition-colors duration-[250ms]"
									style={{
										color: city.special ? "rgba(255,255,255,0.85)" : "var(--muted)",
									}}
								>
									{city.min}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
