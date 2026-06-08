/**
 * Storefront "recently viewed" rail — port of the Balasi design
 * (index.html §recently, id="recently"). Reads client-only snapshots recorded
 * on the product page; renders nothing until the visitor has opened a product.
 */

import { TProduct } from "@jsdev_ninja/core";
import { Product } from "src/widgets/Product/Product";
import { formatter } from "src/utils/formatter";
import { navigate } from "src/navigation";
import { useRecentlyViewed } from "../useRecentlyViewed";

const ORANGE = "var(--brand-secondary)"; // design --pop (#e8804a)

function getProductName(product: TProduct): string {
	return product.name.find((l) => l.lang === "he")?.value ?? product.name[0]?.value ?? "";
}

function RecentCard({ product }: { product: TProduct }) {
	const name = getProductName(product);
	const price = formatter.price(product.price);

	return (
		<a
			href="#"
			onClick={(e) => {
				e.preventDefault();
				navigate({ to: "store.product", params: { id: product.id }, state: { product } });
			}}
			className="flex flex-shrink-0 flex-col overflow-hidden rounded-sm border border-[var(--border)] bg-[var(--surface)] p-[18px_18px_16px] transition-all duration-[250ms] hover:-translate-y-1 hover:border-[var(--foreground)] hover:shadow-[0_12px_32px_rgba(26,26,23,0.10)]"
			style={{ width: "220px" }}
		>
			<div className="mb-3.5 flex h-[64px] items-center justify-center">
				<Product product={product}>
					<div className="h-[64px] w-[64px] overflow-hidden rounded">
						<Product.Image />
					</div>
				</Product>
			</div>

			<div
				className="mb-1 line-clamp-2 text-[14px] font-bold leading-tight tracking-tight text-[var(--foreground)]"
				style={{ minHeight: "2.7em" }}
			>
				{name}
			</div>

			<div className="flex items-center justify-between gap-2.5 border-t border-[var(--border)] pt-3">
				<span className="text-[20px] font-black leading-none tracking-tight text-[var(--foreground)]">
					{price}
				</span>
				<span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: ORANGE }}>
					לצפייה
				</span>
			</div>
		</a>
	);
}

export default function RecentlyViewed() {
	const { products, clear } = useRecentlyViewed();

	if (!products.length) return null;

	return (
		<section className="py-16" style={{ background: "var(--background)" }}>
			<div className="container mx-auto px-4">
				{/* Head */}
				<div className="mb-7 flex flex-wrap items-end justify-between gap-3.5">
					<div>
						<div
							className="mb-2 inline-flex items-center gap-3 text-[11.5px] font-extrabold uppercase tracking-[0.14em]"
							style={{ color: ORANGE }}
						>
							<span className="h-px w-6" style={{ background: ORANGE }} />
							צפיתם לאחרונה
						</div>
						<h2 className="text-[clamp(28px,3.6vw,44px)] font-extrabold leading-tight tracking-tight text-[var(--foreground)]">
							חזרה למוצרים{" "}
							<em className="font-light italic" style={{ fontFamily: "var(--font-serif)", color: ORANGE }}>
								שראיתם.
							</em>
						</h2>
					</div>
					<button
						type="button"
						onClick={clear}
						className="border-b-[1.5px] border-[var(--foreground)] pb-0.5 text-[11px] font-bold text-[var(--foreground)] transition hover:border-[var(--brand-secondary)] hover:text-[var(--brand-secondary)]"
					>
						נקה היסטוריה
					</button>
				</div>

				{/* Rail */}
				<div className="flex gap-[18px] overflow-x-auto pb-6 [scrollbar-width:thin]" style={{ scrollBehavior: "smooth" }}>
					{products.map((product) => (
						<RecentCard key={product.id} product={product} />
					))}
				</div>
			</div>
		</section>
	);
}
