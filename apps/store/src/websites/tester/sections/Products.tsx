/**
 * Storefront products grid (tester dev-preview) — UI-only port of the new
 * Balasi design (index.html §products, SIMPLIFIED). Static illustrative cards,
 * theme tokens only. SKIPS filter sidebar / sort select / subcat strip.
 * Section id="products" is required (hero & categories anchor to it).
 */

const ORANGE = "var(--brand-secondary)"; // design --pop
const SERIF = "var(--font-serif)";

type Product = {
	id: string;
	emoji: string;
	cat: string;
	name: string;
	price: string;
	unit: string;
	tag?: "sale" | "new";
	tagLabel?: string;
};

const PRODUCTS: Product[] = [
	{
		id: "p1",
		emoji: "☕",
		cat: "קפה ושתייה חמה",
		name: "קפסולות נספרסו אינטנסו × 50",
		price: "₪84",
		unit: "לקופסה",
		tag: "sale",
		tagLabel: "מבצע",
	},
	{
		id: "p2",
		emoji: "💧",
		cat: "משקאות",
		name: "מים מינרליים 1.5L × 6",
		price: "₪22",
		unit: "לארגז",
	},
	{
		id: "p3",
		emoji: "🍫",
		cat: "חטיפים ומתוקים",
		name: "שוקולד מריר 85% × 6",
		price: "₪68",
		unit: "לארגז",
	},
	{
		id: "p4",
		emoji: "🥗",
		cat: "בריאות וטבעוני",
		name: "חטיפי חומוס אפוי × 12",
		price: "₪72",
		unit: "לארגז",
		tag: "new",
		tagLabel: "חדש",
	},
	{
		id: "p5",
		emoji: "🧼",
		cat: "ניקיון ותחזוקה",
		name: "סבון ידיים נוזלי × 3",
		price: "₪55",
		unit: "לחבילה",
	},
	{
		id: "p6",
		emoji: "🍎",
		cat: "פירות וירקות",
		name: "סל פירות עונתי ממובחר",
		price: "₪120",
		unit: "לסל",
	},
	{
		id: "p7",
		emoji: "🥤",
		cat: "משקאות",
		name: "קולה זירו 500ml × 24",
		price: "₪110",
		unit: "לארגז",
	},
	{
		id: "p8",
		emoji: "🍽️",
		cat: "כלים חד-פעמיים",
		name: 'צלחות נייר × 100',
		price: "₪48",
		unit: "לחבילה",
	},
];

function ProductCard({ product }: { product: Product }) {
	const tagStyle =
		product.tag === "sale"
			? { background: ORANGE, color: "white" }
			: { background: "var(--surface)", color: "var(--foreground)", border: "1.5px solid var(--foreground)" };

	return (
		<a
			href="#products"
			className="group relative flex flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--foreground)] hover:shadow-[0_12px_36px_rgba(13,13,11,0.08)]"
		>
			{/* Image area */}
			<div
				className="relative flex h-[200px] items-center justify-center border-b border-[var(--border)]"
				style={{ background: "linear-gradient(180deg,var(--color-section-alt),var(--surface))" }}
			>
				<span className="text-[78px] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-2">
					{product.emoji}
				</span>
				{product.tag && product.tagLabel && (
					<span
						className="absolute start-3 top-3 px-3 py-1 text-[9.5px] font-bold uppercase tracking-[0.16em]"
						style={tagStyle}
					>
						{product.tagLabel}
					</span>
				)}
			</div>

			{/* Body */}
			<div className="flex flex-1 flex-col gap-1.5 p-[18px_18px_20px]">
				<span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: ORANGE }}>
					{product.cat}
				</span>
				<h3 className="line-clamp-2 min-h-[38px] text-[15px] font-extrabold leading-tight tracking-tight text-[var(--foreground)]">
					{product.name}
				</h3>
				<span className="text-[11.5px] text-[var(--muted)]">{product.unit}</span>

				<div className="mt-3.5 flex items-center justify-between gap-2.5 border-t border-[var(--border)] pt-3.5">
					<span className="text-[22px] font-black leading-none tracking-tight text-[var(--foreground)]">
						{product.price}
					</span>
					<span
						className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-[var(--foreground)] text-white transition-all duration-300 group-hover:bg-[var(--brand-secondary)] group-hover:rotate-90"
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
							<line x1="12" y1="5" x2="12" y2="19" />
							<line x1="5" y1="12" x2="19" y2="12" />
						</svg>
					</span>
				</div>
			</div>
		</a>
	);
}

export default function Products() {
	return (
		<section id="products" className="py-20 lg:py-28" style={{ background: "var(--background)" }}>
			<div className="container mx-auto px-4">
				{/* Row head */}
				<div className="mb-[60px]">
					<div
						className="mb-5 inline-flex items-center gap-3.5 text-[11px] font-bold uppercase tracking-[0.18em]"
						style={{ color: ORANGE }}
					>
						<span className="h-px w-6" style={{ background: ORANGE }} />
						הקטלוג המלא
					</div>
					<h2 className="text-[clamp(34px,4.6vw,68px)] font-extrabold leading-none tracking-tight text-[var(--foreground)]">
						כל המוצרים{" "}
						<em className="font-light italic" style={{ fontFamily: SERIF, color: ORANGE }}>
							שלנו.
						</em>
					</h2>
				</div>

				{/* Product grid — 2 cols mobile, 4 cols desktop */}
				<div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
					{PRODUCTS.map((product) => (
						<ProductCard key={product.id} product={product} />
					))}
				</div>
			</div>
		</section>
	);
}
