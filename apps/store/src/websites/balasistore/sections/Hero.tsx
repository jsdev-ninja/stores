/**
 * Storefront hero — port of the Balasi design.
 * Right-side "popular picks" cards now show real products.
 */

import { navigate } from "src/navigation";
import { TProduct } from "@jsdev_ninja/core";
import { Product } from "src/widgets/Product/Product";
import { formatter } from "src/utils/formatter";

const ORANGE = "var(--brand-secondary)"; // design --pop (#e8804a)
const SERIF = "var(--font-serif)";

const RANK_LABELS = ["01", "02", "03"] as const;
const RANK_TAGS = ["פריט נמכר", "חדש בקטלוג", "המומלץ שלנו"] as const;

type Props = { products: TProduct[] };

function getProductName(product: TProduct): string {
	return product.name.find((l) => l.lang === "he")?.value ?? product.name[0]?.value ?? "";
}

function SmallPickCard({ product, rotate, rank }: { product: TProduct; rotate: string; rank: number }) {
	const name = getProductName(product);
	const price = formatter.price(product.price);

	return (
		<div
			className="self-center flex flex-col items-start gap-1.5 rounded-lg p-3.5 bg-[var(--surface)] text-[var(--foreground)] shadow-[0_18px_40px_rgba(0,0,0,0.45)] transition-all duration-300 ease-out group-hover/picks:opacity-40 hover:!opacity-100 hover:!shadow-[0_26px_55px_rgba(0,0,0,0.55)]"
			style={{ border: `1px solid color-mix(in oklab, ${ORANGE} 30%, transparent)`, transform: rotate }}
		>
			<span className="text-[13px] italic" style={{ fontFamily: SERIF, color: ORANGE }}>
				{RANK_LABELS[rank]}
			</span>
			<Product product={product}>
				<div className="self-center w-[60px] h-[60px] overflow-hidden rounded">
					<Product.Image />
				</div>
			</Product>
			<span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
				{RANK_TAGS[rank]}
			</span>
			<span className="italic text-[15px] leading-tight text-[var(--foreground)] line-clamp-2" style={{ fontFamily: SERIF }}>
				{name}
			</span>
			<div className="mt-1.5 flex w-full items-baseline justify-between gap-2 border-t border-black/10 pt-2.5">
				<span className="italic text-[21px] leading-none" style={{ fontFamily: SERIF, color: ORANGE }}>
					{price}
				</span>
			</div>
		</div>
	);
}

function BigPickCard({ product, rank }: { product: TProduct; rank: number }) {
	const lightGreen = "color-mix(in oklab, var(--accent) 38%, #ffffff)";
	const name = getProductName(product);
	const price = formatter.price(product.price);

	return (
		<div
			className="self-center flex flex-col items-center justify-center gap-2 rounded-lg px-4 pb-4 pt-5 text-[var(--surface)] shadow-[0_28px_60px_color-mix(in_oklab,var(--accent)_40%,transparent)] transition-all duration-300 ease-out group-hover/picks:opacity-40 hover:!opacity-100 hover:!-translate-y-1 hover:!shadow-[0_36px_75px_color-mix(in_oklab,var(--accent)_55%,transparent)]"
			style={{
				background: "linear-gradient(180deg, color-mix(in oklab, var(--foreground) 88%, #ffffff) 0%, var(--foreground) 100%)",
				border: "1px solid var(--accent)",
			}}
		>
			<div className="flex w-full items-center gap-3">
				<span className="text-[18px] italic" style={{ fontFamily: SERIF, color: lightGreen }}>
					{RANK_LABELS[rank]}
				</span>
				<span className="h-px flex-1" style={{ background: "color-mix(in oklab, var(--accent) 30%, transparent)" }} />
			</div>
			<Product product={product}>
				<div className="my-1 w-[80px] h-[80px] overflow-hidden rounded-md">
					<Product.Image />
				</div>
			</Product>
			<span
				className="self-center text-[11px] font-bold uppercase tracking-[0.28em]"
				style={{ color: lightGreen }}
			>
				{RANK_TAGS[rank]}
			</span>
			<h3 className="text-center text-[24px] font-light leading-tight text-[var(--surface)] line-clamp-2" style={{ fontFamily: SERIF }}>
				{name}
			</h3>
			<div
				className="mt-auto flex w-full items-baseline gap-2 pt-3.5"
				style={{ borderTop: "1px solid color-mix(in oklab, var(--accent) 25%, transparent)" }}
			>
				<span className="text-[28px] font-light italic" style={{ fontFamily: SERIF, color: lightGreen }}>
					{price}
				</span>
			</div>
		</div>
	);
}

export default function Hero({ products }: Props) {
	const [p0, p1, p2] = products;

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

					{p0 && p1 && p2 ? (
						<div className="group/picks grid flex-1 grid-cols-[1fr_1.6fr_1fr] items-center gap-4">
							<SmallPickCard product={p0} rotate="none" rank={0} />
							<BigPickCard product={p1} rank={1} />
							<SmallPickCard product={p2} rotate="none" rank={2} />
						</div>
					) : null}
				</div>
			</div>
		</section>
	);
}
