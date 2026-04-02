import { useState } from "react";
import logoUrl from "../../assets/logo.png";
import { app } from "../../firebase/index";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const db = getFirestore(app);

const features = [
	{
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7">
				<path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
			</svg>
		),
		title: "חנות אונליין מוכנה מהיום",
		description: "חנות דיגיטלית מלאה עם עיצוב מקצועי, חיפוש מוצרים ועגלת קניות — מוכנה להפעלה תוך שעות.",
		bg: "#e8f5e9",
		color: "#004c3f",
	},
	{
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7">
				<path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
			</svg>
		),
		title: "ניהול הזמנות ומשלוחים",
		description: "עקבו אחרי כל הזמנה בזמן אמת, נהלו סטטוסים ושלחו ללקוח עדכונים אוטומטיים.",
		bg: "#fff8e1",
		color: "#b45309",
	},
	{
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7">
				<path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
			</svg>
		),
		title: "צ׳אטבוט AI לשירות לקוחות",
		description: "הבוט החכם עונה לשאלות לקוחות 24/7, מסייע בחיפוש מוצרים ואפילו מוסיף פריטים לעגלה.",
		bg: "#e8eaf6",
		color: "#3730a3",
	},
	{
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7">
				<path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
			</svg>
		),
		title: "תשלום מאובטח",
		description: "אינטגרציה מלאה עם מערכות תשלום ישראליות — הלקוחות שלכם משלמים בקלות ובביטחון מלא.",
		bg: "#fce4ec",
		color: "#be123c",
	},
	{
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7">
				<path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
			</svg>
		),
		title: "חשבוניות אוטומטיות",
		description: "חשבוניות מס ותעודות משלוח נוצרות אוטומטית לכל הזמנה — ללא עבודה ידנית.",
		bg: "#e0f2f1",
		color: "#0f766e",
	},
	{
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7">
				<path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
			</svg>
		),
		title: "פאנל ניהול מלא",
		description: "שליטה מלאה על מוצרים, קטגוריות, הנחות, לקוחות וסטטיסטיקות — הכל במקום אחד.",
		bg: "#fff3e0",
		color: "#c2410c",
	},
	{
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7">
				<path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		),
		title: "ללא עלות הקמה",
		description: "לא משלמים כלום להתחיל. משלמים רק אחוז קטן מהמכירות — כשאתם מרוויחים, אנחנו מרוויחים.",
		bg: "#f3e8ff",
		color: "#7e22ce",
	},
];

const steps = [
	{
		num: "01",
		title: "פותחים חנות",
		description: "יוצרים חשבון, מגדירים את פרטי העסק ומקבלים חנות אונליין מוכנה עם כתובת URL משלכם.",
	},
	{
		num: "02",
		title: "מעלים מוצרים",
		description: "מוסיפים מוצרים, תמונות, מחירים וקטגוריות — ממשק ניהול פשוט שלא דורש ידע טכני.",
	},
	{
		num: "03",
		title: "מתחילים למכור",
		description: "הלקוחות שלכם מגיעים לחנות, קונים ומשלמים — אתם מקבלים התראות ומנהלים הכל מהפאנל.",
	},
];

const testimonials = [
	{
		quote: "החנות עובדת מעולה ומאפשרת לי למכור אונליין בקלות.",
		store: "balasistore.com",
		initials: "ב",
	},
	{
		quote: "תשתית מעולה שמאפשרת לי לנהל חנות כמו שצריך.",
		store: "pecanis.online",
		initials: "פ",
	},
];

function StoreBrixLogo({ size = 32 }: { size?: number }) {
	return (
		<div className="flex items-center gap-2">
			<img src={logoUrl} alt="StoreBrix" width={size} height={size} style={{ objectFit: "contain" }} />
			<span
				style={{ fontFamily: "'Heebo', sans-serif", letterSpacing: "-0.5px" }}
				className="text-[#004c3f] font-bold text-xl"
			>
				StoreBrix
			</span>
		</div>
	);
}

export default function Page() {
	const [formData, setFormData] = useState({ name: "", phone: "", email: "", message: "" });
	const [submitting, setSubmitting] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);


	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmitting(true);
		try {
			await addDoc(collection(db, "landingLeads"), {
				...formData,
				createdAt: serverTimestamp(),
			});
			// Fire Google Ads conversion event
			if (typeof window !== "undefined" && (window as any).gtag) {
				(window as any).gtag('event', 'conversion', {
					send_to: 'AW-18048902473/MI7qCNOpm5QcEMnKsZ5D',
					value: 1.0,
					currency: 'ILS',
				});
			}
			setFormData({ name: "", phone: "", email: "", message: "" });
			setShowSuccess(true);
		} catch (err) {
			console.error("Failed to submit form", err);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div dir="rtl" style={{ fontFamily: "'Heebo', sans-serif" }} className="w-full min-h-screen bg-white text-right">

			{/* ===== SUCCESS POPUP ===== */}
			{showSuccess && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSuccess(false)}>
					<div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
						<div className="w-16 h-16 bg-[#e8f5e9] rounded-full flex items-center justify-center mx-auto mb-4">
							<svg className="w-8 h-8 text-[#004c3f]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<h3 className="text-[#004c3f] text-xl font-black mb-2">הפרטים התקבלו!</h3>
						<p className="text-[#57605e] text-sm mb-6">ניצור איתכם קשר תוך 24 שעות כדי לפתוח את החנות שלכם.</p>
						<button
							onClick={() => setShowSuccess(false)}
							className="bg-[#004c3f] text-[#ffdb95] px-6 py-2.5 rounded-lg font-bold hover:bg-[#003830] transition-colors"
						>
							סגור
						</button>
					</div>
				</div>
			)}

			{/* ===== NAVBAR ===== */}
			<header className="bg-[#fbf7ec] sticky top-0 z-50 border-b border-[#e8e0d0]">
				<div className="container mx-auto px-5 py-4 flex items-center justify-between">
					<StoreBrixLogo />
					<nav className="hidden md:flex items-center gap-8 text-[#424c4a] text-sm font-medium">
						<a href="#features" className="hover:text-[#004c3f] transition-colors">יתרונות</a>
						<a href="#how" className="hover:text-[#004c3f] transition-colors">איך זה עובד</a>
						<a href="#pricing" className="hover:text-[#004c3f] transition-colors">תמחור</a>
						<a href="#testimonials" className="hover:text-[#004c3f] transition-colors">לקוחות</a>
					</nav>
					<a
						href="#contact"
						className="bg-[#004c3f] text-[#ffdb95] px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#003830] transition-colors"
					>
						התחל עכשיו
					</a>
				</div>
			</header>

			{/* ===== HERO ===== */}
			<section className="bg-[#fbf7ec] pt-16 pb-20 md:pt-24 md:pb-32">
				<div className="container mx-auto px-5">
					<div className="max-w-3xl mx-auto text-center">
						<h1
							className="text-[#004c3f] text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6"
							style={{ lineHeight: "1.2" }}
						>
							פתחו חנות אונליין לעסק שלכם —
							<br />
							<span className="text-[#57605e] font-light">בחינם, תוך שעות.</span>
						</h1>
						<p className="text-[#57605e] text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
							StoreBrix מאפשרת לכל עסק לפתוח חנות דיגיטלית מקצועית ללא עלות הקמה וללא תשלום חודשי. מקבלים חנות מוכנה, מנהלים הזמנות ומשלמים רק על מכירות.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<a
								href="#contact"
								className="bg-[#004c3f] text-[#ffdb95] px-8 py-4 rounded-lg font-bold text-base hover:bg-[#003830] transition-colors"
							>
								פתחו חנות עכשיו — בחינם
							</a>
							<a
								href="#how"
								className="border-2 border-[#004c3f] text-[#004c3f] px-8 py-4 rounded-lg font-bold text-base hover:bg-[#004c3f]/5 transition-colors"
							>
								איך זה עובד?
							</a>
						</div>
					</div>

					{/* Stats */}
					<div className="mt-16 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
						{[
							{ num: "0%", label: "דמי הקמה" },
							{ num: "24/7", label: "שירות לקוחות AI" },
							{ num: "100%", label: "שליטה על העסק" },
						].map((stat, i) => (
							<div key={i} className="text-center">
								<p className="text-[#004c3f] text-3xl md:text-4xl font-black">{stat.num}</p>
								<p className="text-[#57605e] text-sm mt-1">{stat.label}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ===== FEATURES ===== */}
			<section id="features" className="py-16 md:py-24 bg-white">
				<div className="container mx-auto px-5">
					<div className="text-center mb-12">
						<p className="text-[#004c3f] text-sm font-semibold uppercase tracking-widest mb-3">מה מקבלים</p>
						<h2 className="text-[#212625] text-3xl md:text-4xl font-black mb-4">
							כל מה שצריך למכור אונליין
						</h2>
						<p className="text-[#57605e] text-base max-w-xl mx-auto">
							לא צריך לדעת תכנות. לא צריך לשכור מפתח. הכל מוכן ועובד מהיום הראשון.
						</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
						{features.map((f, i) => (
							<div
								key={i}
								className="border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow"
							>
								<div
									className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
									style={{ backgroundColor: f.bg, color: f.color }}
								>
									{f.icon}
								</div>
								<h3 className="text-[#212625] font-bold text-base mb-2">{f.title}</h3>
								<p className="text-[#57605e] text-sm leading-relaxed">{f.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ===== HOW IT WORKS ===== */}
			<section id="how" className="py-16 md:py-24 bg-[#fbf7ec]">
				<div className="container mx-auto px-5">
					<div className="text-center mb-12">
						<p className="text-[#004c3f] text-sm font-semibold uppercase tracking-widest mb-3">תהליך פשוט</p>
						<h2 className="text-[#212625] text-3xl md:text-4xl font-black mb-4">
							מתחילים ב-3 צעדים
						</h2>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
						{steps.map((step, i) => (
							<div key={i} className="relative">
								{i < steps.length - 1 && (
									<div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-[#004c3f]/20 -z-0" />
								)}
								<div className="relative z-10">
									<div className="w-16 h-16 bg-[#004c3f] text-[#ffdb95] rounded-2xl flex items-center justify-center font-black text-xl mb-4 mx-auto md:mx-0">
										{step.num}
									</div>
									<h3 className="text-[#212625] font-bold text-lg mb-2">{step.title}</h3>
									<p className="text-[#57605e] text-sm leading-relaxed">{step.description}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ===== PRICING ===== */}
			<section id="pricing" className="py-16 md:py-24 bg-[#004c3f]">
				<div className="container mx-auto px-5">
					<div className="max-w-3xl mx-auto text-center">
						<p className="text-[#ffdb95] text-sm font-semibold uppercase tracking-widest mb-3">תמחור פשוט</p>
						<h2 className="text-white text-3xl md:text-4xl font-black mb-4">
							משלמים רק כשמוכרים
						</h2>
						<p className="text-white/70 text-base mb-12 max-w-xl mx-auto">
							אנחנו מאמינים בשותפות אמיתית — לא גובים עלות הקמה ולא תשלום חודשי קבוע. כשהעסק שלכם צומח, גם אנחנו גדלים.
						</p>

						<div className="bg-white rounded-2xl p-8 md:p-10 text-right">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
								{[
									{ icon: "✓", text: "ללא דמי הקמה" },
									{ icon: "✓", text: "ללא תשלום חודשי קבוע" },
									{ icon: "✓", text: "רק אחוז קטן מהמכירות" },
								].map((item, i) => (
									<div key={i} className="flex items-center gap-3 bg-[#004c3f]/5 rounded-xl p-4">
										<span className="text-[#004c3f] font-black text-lg">{item.icon}</span>
										<span className="text-[#212625] font-semibold text-sm">{item.text}</span>
									</div>
								))}
							</div>
							<p className="text-[#57605e] text-sm">
								רוצים לדעת בדיוק כמה? צרו קשר ונתאים עבורכם תנאים אישיים.
							</p>
							<a
								href="#contact"
								className="inline-block mt-6 bg-[#004c3f] text-[#ffdb95] px-8 py-4 rounded-lg font-bold text-base hover:bg-[#003830] transition-colors"
							>
								דברו איתנו
							</a>
						</div>
					</div>
				</div>
			</section>

			{/* ===== TESTIMONIALS ===== */}
			<section id="testimonials" className="py-16 md:py-24 bg-white">
				<div className="container mx-auto px-5">
					<div className="text-center mb-12">
						<p className="text-[#004c3f] text-sm font-semibold uppercase tracking-widest mb-3">לקוחות מרוצים</p>
						<h2 className="text-[#212625] text-3xl md:text-4xl font-black">
							מה אומרים עלינו
						</h2>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
						{testimonials.map((t, i) => (
							<div key={i} className="bg-[#fbf7ec] rounded-2xl p-8 border border-[#e8e0d0]">
								<div className="flex gap-1 mb-4">
									{[...Array(5)].map((_, si) => (
										<svg key={si} className="w-5 h-5 text-[#ffdb95] fill-current" viewBox="0 0 20 20">
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
										</svg>
									))}
								</div>
								<p className="text-[#212625] text-lg font-medium leading-relaxed mb-6">
									"{t.quote}"
								</p>
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 bg-[#004c3f] text-[#ffdb95] rounded-full flex items-center justify-center font-bold text-base">
										{t.initials}
									</div>
									<span className="text-[#57605e] text-sm font-medium">{t.store}</span>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ===== CTA ===== */}
			<section id="contact" className="py-16 md:py-24 bg-[#fbf7ec]">
				<div className="container mx-auto px-5 text-center">
					<h2 className="text-[#004c3f] text-3xl md:text-4xl font-black mb-4">
						מוכנים להתחיל למכור?
					</h2>
					<p className="text-[#57605e] text-base md:text-lg mb-8 max-w-lg mx-auto">
						השאירו פרטים ואנחנו ניצור איתכם קשר תוך 24 שעות כדי לפתוח את החנות שלכם.
					</p>
					<form
						className="flex flex-col gap-3 max-w-md mx-auto"
						onSubmit={handleSubmit}
					>
						<input
							type="text"
							placeholder="שם מלא"
							required
							value={formData.name}
							onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
							className="border border-[#d0c8b8] rounded-lg px-4 py-3 text-[#212625] text-right focus:outline-none focus:ring-2 focus:ring-[#004c3f] bg-white"
						/>
						<input
							type="tel"
							placeholder="מספר טלפון"
							required
							value={formData.phone}
							onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
							className="border border-[#d0c8b8] rounded-lg px-4 py-3 text-[#212625] text-right focus:outline-none focus:ring-2 focus:ring-[#004c3f] bg-white"
						/>
						<input
							type="email"
							placeholder="אימייל"
							required
							value={formData.email}
							onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
							className="border border-[#d0c8b8] rounded-lg px-4 py-3 text-[#212625] text-right focus:outline-none focus:ring-2 focus:ring-[#004c3f] bg-white"
						/>
						<textarea
							rows={3}
							placeholder="תיאור קצר על העסק — אופציונלי"
							value={formData.message}
							onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
							className="border border-[#d0c8b8] rounded-lg px-4 py-3 text-[#212625] text-right focus:outline-none focus:ring-2 focus:ring-[#004c3f] bg-white resize-none"
						/>
						<button
							type="submit"
							disabled={submitting}
							className="bg-[#004c3f] text-[#ffdb95] px-6 py-3 rounded-lg font-bold hover:bg-[#003830] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
						>
							{submitting ? "שולח..." : "דברו איתי"}
						</button>
					</form>
					<p className="text-[#57605e] text-xs mt-4">
						ללא התחייבות. ללא כרטיס אשראי.
					</p>
				</div>
			</section>

			{/* ===== FOOTER ===== */}
			<footer className="bg-[#004c3f] py-12">
				<div className="container mx-auto px-5">
					<div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
						<div>
							<div className="flex items-center gap-2 mb-3">
								<img src={logoUrl} alt="StoreBrix" width={28} height={28} style={{ objectFit: "contain" }} />
								<span className="text-white font-bold text-xl">StoreBrix</span>
							</div>
							<p className="text-white/60 text-sm max-w-xs leading-relaxed">
								פלטפורמת החנויות האונליין לעסקים ישראליים — פשוט, מהיר, ומשתלם.
							</p>
						</div>

						<div className="grid grid-cols-2 gap-8 text-sm">
							<div>
								<p className="text-white font-semibold mb-3">הפלטפורמה</p>
								<ul className="space-y-2 text-white/60">
									<li><a href="#features" className="hover:text-white transition-colors">יתרונות</a></li>
									<li><a href="#how" className="hover:text-white transition-colors">איך זה עובד</a></li>
									<li><a href="#pricing" className="hover:text-white transition-colors">תמחור</a></li>
								</ul>
							</div>
							<div>
								<p className="text-white font-semibold mb-3">יצירת קשר</p>
								<ul className="space-y-2 text-white/60">
									<li><a href="#contact" className="hover:text-white transition-colors">דברו איתנו</a></li>
									<li><a href="#testimonials" className="hover:text-white transition-colors">לקוחות</a></li>
								</ul>
							</div>
						</div>
					</div>

					<div className="border-t border-white/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-2">
						<p className="text-white/50 text-sm">© StoreBrix 2026. כל הזכויות שמורות.</p>
						<p className="text-white/30 text-xs">עשוי באהבה בישראל 🇮🇱</p>
					</div>
				</div>
			</footer>

		</div>
	);
}
