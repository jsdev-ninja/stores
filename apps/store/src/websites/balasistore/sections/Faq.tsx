/**
 * Storefront FAQ — UI-only port of the new Balasi design
 * (index.html §faq). Native <details>/<summary> accordion, theme tokens only.
 */

const ORANGE = "var(--brand-secondary)"; // design --pop
const SERIF = "var(--font-serif)";

type FaqItem = {
	q: string;
	a: string;
};

const FAQS: FaqItem[] = [
	{
		q: "באילו ערים אתם מספקים?",
		a: "אנחנו מספקים ב-9 ערים במרכז הארץ: תל אביב, רמת גן, פתח תקווה, בני ברק, גבעת שמואל, גבעתיים, הרצליה, רמת השרון והוד השרון. ניתן לראות את אזורי השירות המלאים בסקשן אזורי השירות.",
	},
	{
		q: "מה זמן האספקה?",
		a: "ברוב הערים אספקה תוך 24 שעות מאישור ההזמנה. ברמת השרון ובהוד השרון אספקה תוך 1-2 ימי עסקים. ניתן לתאם מועד אספקה ספציפי בעת ההזמנה.",
	},
	{
		q: "מה המינימום להזמנה?",
		a: 'מינימום הזמנה ברוב הערים הוא ₪500 לפני מע"מ. ברמת השרון ובהוד השרון המינימום הוא ₪650 לפני מע"מ.',
	},
	{
		q: "האם המשלוח חינם?",
		a: "כן — בהזמנות מעל ₪650. בהזמנות מתחת לסכום זה, דמי המשלוח הם ₪26.",
	},
	{
		q: "אילו אופני תשלום אתם מקבלים?",
		a: "אנחנו מקבלים: כרטיס אשראי והעברה בנקאית.",
	},
	{
		q: "איך מבטלים או מחליפים מוצר?",
		a: "ניתן לבטל הזמנה ללא חיוב עד שעתיים מאישור ההזמנה. מוצרים פגומים, פגי תוקף או שאינם תואמים — יוחזרו תוך 14 ימי עסקים בזיכוי מלא או החלפה.",
	},
	{
		q: "האם יש מוצרים בריאים / טבעוניים / ללא לקטוז?",
		a: 'בהחלט. יש לנו קטגוריה ייעודית של "בריאות וטבעוני" עם מוצרים טבעוניים, ללא לקטוז, חלבונים צמחיים ועוד.',
	},
	{
		q: "האם אתם מספקים גם ללקוחות פרטיים?",
		a: "השירות שלנו מיועד לחברות, עסקים ומשרדים (B2B). לרכישה פרטית פנו לפלטפורמות מסחר לצרכן.",
	},
	{
		q: "אפשר להגדיר הזמנה קבועה שבועית?",
		a: 'כן. בעת ביצוע ההזמנה ניתן לסמן את האופציה "הזמנה קבועה שבועית" וההזמנה תחזור על עצמה אוטומטית מדי שבוע. ניתן לבטל בכל עת בפנייה לשירות הלקוחות.',
	},
];

export default function Faq() {
	return (
		<section id="faq" className="py-20 lg:py-28" style={{ background: "var(--color-section-alt)" }}>
			<div className="container mx-auto px-4">
				{/* Centered head */}
				<div className="mb-[60px] text-center">
					<div
						className="mb-5 inline-flex items-center justify-center gap-3.5 text-[11px] font-bold uppercase tracking-[0.18em]"
						style={{ color: ORANGE }}
					>
						<span className="h-px w-6" style={{ background: ORANGE }} />
						שאלות נפוצות
						<span className="h-px w-6" style={{ background: ORANGE }} />
					</div>
					<h2 className="text-center text-[clamp(34px,4.6vw,68px)] font-extrabold leading-none tracking-tight text-[var(--foreground)]">
						תשובות על השאלות{" "}
						<em className="font-light italic" style={{ fontFamily: SERIF, color: ORANGE }}>
							שאתם שואלים.
						</em>
					</h2>
				</div>

				{/* FAQ list */}
				<div
					className="mx-auto flex max-w-[780px] flex-col gap-px border border-[var(--border)]"
					style={{ background: "var(--border)" }}
				>
					{FAQS.map((item) => (
						<details
							key={item.q}
							className="group bg-[var(--surface)] transition-colors duration-[250ms] open:bg-[var(--surface)]"
						>
							<summary className="flex cursor-pointer list-none items-center justify-between gap-[18px] p-[22px_28px] transition-colors duration-200 hover:bg-[var(--color-section-alt)]">
								<span className="flex-1 text-[16px] font-bold leading-tight tracking-tight text-[var(--foreground)]">
									{item.q}
								</span>
								{/* +/× icon */}
								<span
									className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-section-alt)] text-[18px] font-bold text-[var(--foreground)] transition-all duration-[300ms] group-open:rotate-45 group-open:bg-[var(--accent)] group-open:text-white"
								>
									+
								</span>
							</summary>
							<div className="animate-[faqOpen_0.25s_ease-out] pb-[22px] pe-[28px] ps-[28px]">
								<p className="text-[14.5px] font-normal leading-[1.7] text-[var(--muted)]">
									{item.a}
								</p>
							</div>
						</details>
					))}
				</div>
			</div>
		</section>
	);
}
