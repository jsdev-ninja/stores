/**
 * Storefront footer (tester dev-preview) — UI-only port of the new Balasi
 * design (index.html §footer). This replaces the old shared Footer.
 * Static links, theme tokens only, no feature wiring.
 */


const NAV_STORE = [
	{ label: "קטגוריות", href: "#categories" },
	{ label: "קטלוג מלא", href: "#products" },
	{ label: "מוצרים פופולריים", href: "#featured" },
	{ label: "אזורי שירות", href: "#service-areas" },
];

const NAV_SUPPORT = [
	{ label: "balasistore5@gmail.com", href: "mailto:balasistore5@gmail.com" },
	{ label: "שירות אונליין בלבד", href: "#" },
	{ label: "תגובה תוך 24 שעות עסקיות", href: "#" },
	{ label: "א'-ה' (לא בשבת ובחג)", href: "#" },
];

const LEGAL_LINKS = [
	{ label: "תנאי שימוש", href: "terms.html" },
	{ label: "מדיניות פרטיות", href: "privacy.html" },
	{ label: "מדיניות החזרות", href: "terms.html#cancel" },
	{ label: "הצהרת נגישות", href: "accessibility.html" },
];

export default function Footer() {
	return (
		<footer
			id="contact"
			className="pb-7 pt-20 text-white/60"
			style={{ background: "var(--foreground)" }}
		>
			<div className="container mx-auto px-4">
				{/* Top row */}
				<div
					className="mb-[50px] grid grid-cols-1 gap-[60px] border-b border-white/[0.08] pb-[50px] lg:grid-cols-[1.4fr_2fr]"
				>
					{/* Brand */}
					<div className="max-w-[380px]">
						<a href="#" className="mb-5 inline-block" aria-label="בלסי סטור — חזרה לראש העמוד">
							{/* Logo text fallback (SVG not copied) */}
							<span className="text-[22px] font-black tracking-tight text-white">
								בלסי סטור
							</span>
						</a>
						<p className="text-[13.5px] font-normal leading-[1.75] text-white/55">
							חברת אספקה מקצועית למשרדים במרכז הארץ. מוצרי מזון, קפה, חטיפים, ניקיון וכלים חד-פעמיים — בהזמנה אחת.
						</p>

						{/* Social icons */}
						<div className="mt-[18px] flex gap-2">
							<a
								href="https://wa.me/"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="ווטסאפ"
								className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white/[0.06] text-white transition-all duration-[250ms] hover:-translate-y-0.5 hover:bg-[var(--brand-secondary)]"
							>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
									<path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1l-1 1.2c-.2.2-.4.3-.7.1-1.4-.7-2.4-1.4-3.5-3-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.3 5.2 4.6 1.9.8 2.7.9 3.6.7.6-.1 1.7-.7 2-1.4.2-.6.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3M12 22a10 10 0 0 1-5.1-1.4L2 22l1.4-4.7A9.9 9.9 0 0 1 12 2a10 10 0 0 1 0 20" />
								</svg>
							</a>
							<a
								href="mailto:balasistore5@gmail.com"
								aria-label="מייל"
								className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white/[0.06] text-white transition-all duration-[250ms] hover:-translate-y-0.5 hover:bg-[var(--brand-secondary)]"
							>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
									<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
									<polyline points="22,6 12,13 2,6" />
								</svg>
							</a>
						</div>
					</div>

					{/* Nav columns */}
					<div className="grid grid-cols-1 gap-7 sm:grid-cols-3">
						<div>
							<h4 className="mb-[18px] text-[13px] font-extrabold uppercase tracking-[0.06em] text-white">
								חנות
							</h4>
							<ul className="list-none space-y-2">
								{NAV_STORE.map((link) => (
									<li key={link.label}>
										<a
											href={link.href}
											className="text-[13px] font-normal text-white/50 transition-colors hover:text-[var(--brand-secondary)]"
										>
											{link.label}
										</a>
									</li>
								))}
							</ul>
						</div>

						<div>
							<h4 className="mb-[18px] text-[13px] font-extrabold uppercase tracking-[0.06em] text-white">
								שירות לקוחות
							</h4>
							<ul className="list-none space-y-2">
								{NAV_SUPPORT.map((link) => (
									<li key={link.label}>
										<a
											href={link.href}
											className="text-[13px] font-normal text-white/50 transition-colors hover:text-[var(--brand-secondary)]"
										>
											{link.label}
										</a>
									</li>
								))}
							</ul>
						</div>

						<div>
							<h4 className="mb-[18px] text-[13px] font-extrabold uppercase tracking-[0.06em] text-white">
								אזורי שירות
							</h4>
							<ul className="list-none space-y-2 text-[13px] font-normal text-white/50">
								<li>תל אביב · רמת גן · פתח תקווה</li>
								<li>בני ברק · גבעת שמואל · גבעתיים</li>
								<li>הרצליה</li>
								<li>רמת השרון · הוד השרון</li>
							</ul>
						</div>
					</div>
				</div>

				{/* Legal company identification (required by Israeli law) */}
				<div className="mb-4 border-b border-white/[0.06] pb-4 text-[11.5px] font-normal leading-[1.7] text-white/75">
					<strong>בלסי סטור בע״מ</strong> · ח.פ 516127321 · שונצינו 1, תל אביב · אין קבלת קהל — שירות אונליין בלבד ·{" "}
					<a
						href="mailto:balasistore5@gmail.com"
						className="underline transition-colors hover:text-[var(--brand-secondary)]"
					>
						balasistore5@gmail.com
					</a>
				</div>

				{/* Bottom row */}
				<div className="flex flex-wrap items-center justify-between gap-3.5 text-[11.5px] tracking-[0.06em] text-white/40">
					<span>© 2026 בלסי סטור בע״מ — כל הזכויות שמורות</span>
					<div className="flex flex-wrap gap-6">
						{LEGAL_LINKS.map((link) => (
							<a
								key={link.label}
								href={link.href}
								className="transition-colors hover:text-[var(--brand-secondary)]"
							>
								{link.label}
							</a>
						))}
					</div>
				</div>
			</div>
		</footer>
	);
}
