export default function Head() {
	const structuredData = {
		"@context": "https://schema.org",
		"@type": "Organization",
		"name": "StoreBrix",
		"url": "https://storebrix.com",
		"logo": "https://storebrix.com/assets/static/logo.BQL4COjz.png",
		"description": "פלטפורמה לפתיחת חנות אינטרנטית לעסקים ישראליים — ללא עלות הקמה, ללא תשלום חודשי.",
		"areaServed": "IL",
		"inLanguage": "he"
	};

	const faqStructuredData = {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		"mainEntity": [
			{
				"@type": "Question",
				"name": "כמה עולה לפתוח חנות אונליין ב-StoreBrix?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "פתיחת חנות ב-StoreBrix היא בחינם לחלוטין — ללא עלות הקמה וללא תשלום חודשי. משלמים רק אחוז קטן מהמכירות."
				}
			},
			{
				"@type": "Question",
				"name": "כמה זמן לוקח לפתוח חנות אינטרנטית?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "עם StoreBrix ניתן לפתוח חנות אינטרנטית מקצועית תוך מספר שעות בלבד, ללא צורך בידע טכני."
				}
			},
			{
				"@type": "Question",
				"name": "האם StoreBrix מתאימה לעסקים קטנים?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "כן, StoreBrix מתאימה לכל גודל עסק. הפלטפורמה פשוטה לשימוש ומיועדת לעסקים ישראליים שרוצים למכור אונליין ללא עלויות גבוהות."
				}
			}
		]
	};

	return (
		<>
			{/* Google Ads conversion tracking */}
			<script async src="https://www.googletagmanager.com/gtag/js?id=AW-18048902473"></script>
			<script dangerouslySetInnerHTML={{ __html: `
				window.dataLayer = window.dataLayer || [];
				function gtag(){dataLayer.push(arguments);}
				gtag('js', new Date());
				gtag('config', 'AW-18048902473');
			`}} />

			{/* Primary Meta */}
			<meta charSet="UTF-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<title>StoreBrix — פתיחת חנות אינטרנטית לעסקים בחינם</title>
			<meta name="description" content="פתחו חנות אינטרנטית מקצועית לעסק שלכם בחינם — ללא עלות הקמה, ללא תשלום חודשי. ניהול הזמנות, תשלומים וחשבוניות במקום אחד. התחילו למכור עוד היום." />
			<meta name="keywords" content="חנות אונליין לעסקים, פתיחת חנות אינטרנטית, חנות דיגיטלית לעסק, פלטפורמת מכירות אונליין, חנות אינטרנטית בחינם, חנות וירטואלית לעסקים" />
			<link rel="canonical" href="https://storebrix.com" />

			{/* Open Graph */}
			<meta property="og:type" content="website" />
			<meta property="og:url" content="https://storebrix.com" />
			<meta property="og:title" content="StoreBrix — פתיחת חנות אינטרנטית לעסקים בחינם" />
			<meta property="og:description" content="פתחו חנות אינטרנטית מקצועית לעסק שלכם בחינם. ללא עלות הקמה, ללא תשלום חודשי. משלמים רק כשמוכרים." />
			<meta property="og:image" content="https://storebrix.com/og-image.png" />
			<meta property="og:locale" content="he_IL" />
			<meta property="og:site_name" content="StoreBrix" />

			{/* Twitter Card */}
			<meta name="twitter:card" content="summary_large_image" />
			<meta name="twitter:title" content="StoreBrix — פתיחת חנות אינטרנטית לעסקים בחינם" />
			<meta name="twitter:description" content="פתחו חנות אינטרנטית מקצועית לעסק שלכם בחינם. ללא עלות הקמה, ללא תשלום חודשי." />
			<meta name="twitter:image" content="https://storebrix.com/og-image.png" />

			{/* Structured Data */}
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }} />

			{/* Fonts */}
			<link rel="preconnect" href="https://fonts.googleapis.com" />
			<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
			<link
				href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap"
				rel="stylesheet"
			/>
		</>
	);
}
