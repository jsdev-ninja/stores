/**
 * Storefront products grid — UI port of the Balasi design.
 * Product cards now show real products from Algolia.
 * Section id="products" is required (hero & categories anchor to it).
 */

import { TProduct } from "@jsdev_ninja/core";
import { Product } from "src/widgets/Product/Product";
import { navigate } from "src/navigation";

const ORANGE = "var(--brand-secondary)"; // design --pop
const SERIF = "var(--font-serif)";

type Props = { products: TProduct[] };

function getProductName(product: TProduct): string {
	return product.name.find((l) => l.lang === "he")?.value ?? product.name[0]?.value ?? "";
}

function ProductCard({ product }: { product: TProduct }) {
	const name = getProductName(product);
	const hasDiscount = product.discount?.type !== "none";

	const tagStyle = hasDiscount
		? { background: ORANGE, color: "white" }
		: { background: "var(--surface)", color: "var(--foreground)", border: "1.5px solid var(--foreground)" };

	return (
		<a
			href="#products"
			onClick={(e) => { e.preventDefault(); navigate({ to: "store.product", params: { id: product.id } }); }}
			className="group relative flex flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--foreground)] hover:shadow-[0_12px_36px_rgba(13,13,11,0.08)]"
		>
			{/* Image area */}
			<div
				className="relative flex h-[200px] items-center justify-center border-b border-[var(--border)]"
				style={{ background: "linear-gradient(180deg,var(--color-section-alt),var(--surface))" }}
			>
				<div className="w-[120px] h-[120px] overflow-hidden transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-2">
					<Product product={product}>
						<Product.Image />
					</Product>
				</div>
				{hasDiscount && (
					<span
						className="absolute start-3 top-3 px-3 py-1 text-[9.5px] font-bold uppercase tracking-[0.16em]"
						style={tagStyle}
					>
						מבצע
					</span>
				)}
			</div>

			{/* Body */}
			<div className="flex flex-1 flex-col gap-1.5 p-[18px_18px_20px]">
				<h3 className="line-clamp-2 min-h-[38px] text-[15px] font-extrabold leading-tight tracking-tight text-[var(--foreground)]">
					{name}
				</h3>

				<div className="mt-3.5 flex items-center justify-between gap-2.5 border-t border-[var(--border)] pt-3.5">
					<Product product={product}>
						<Product.Price />
					</Product>
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

export default function Products({ products }: Props) {
	if (!products.length) return null;

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
					{products.map((product) => (
						<ProductCard key={product.id} product={product} />
					))}
				</div>
			</div>
		</section>
	);
}
