/**
 * Storefront monthly deals — UI port of the Balasi design.
 * Deals now come from useDiscounts() (Redux, loaded in App.tsx on user login).
 * TDiscount has bundle-type variants with bundlePrice.
 */

import { useMemo } from "react";
import { TDiscount } from "@jsdev_ninja/core";
import { useDiscounts } from "src/domains/Discounts/Discounts";
import { formatter } from "src/utils/formatter";

const ORANGE = "var(--brand-secondary)"; // design --pop
const SERIF = "var(--font-serif)";

const DEFAULT_ICON = "🏷️";

type CSSProps = { background: string; color: string; border?: string };

const TAG_STYLES: CSSProps = { background: ORANGE, color: "white" };

function getDiscountName(discount: TDiscount): string {
	return discount.name.find((l) => l.lang === "he")?.value ?? discount.name[0]?.value ?? "";
}

function DealCard({ discount }: { discount: TDiscount }) {
	const name = getDiscountName(discount);
	const price =
		discount.variant.variantType === "bundle"
			? formatter.price(discount.variant.bundlePrice)
			: null;

	return (
		<div
			className="group relative flex flex-shrink-0 flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--foreground)] hover:shadow-[0_12px_36px_rgba(13,13,11,0.08)]"
			style={{ width: "240px", scrollSnapAlign: "start" }}
		>
			{/* Image area */}
			<div
				className="relative flex h-[200px] items-center justify-center border-b border-[var(--border)]"
				style={{ background: "linear-gradient(180deg,var(--color-section-alt),var(--surface))" }}
			>
				<span className="text-[78px] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-2">
					{DEFAULT_ICON}
				</span>
				{/* Tag badge */}
				<span
					className="absolute start-3 top-3 px-3 py-1 text-[9.5px] font-bold uppercase tracking-[0.16em]"
					style={TAG_STYLES}
				>
					חבילה
				</span>
			</div>

			{/* Body */}
			<div className="flex flex-1 flex-col gap-1.5 p-[18px_18px_20px]">
				<h3 className="line-clamp-2 min-h-[38px] text-[15px] font-extrabold leading-tight tracking-tight text-[var(--foreground)]">
					{name}
				</h3>

				{/* Price row */}
				<div className="mt-3.5 flex items-center justify-between gap-2.5 border-t border-[var(--border)] pt-3.5">
					<div className="flex items-baseline gap-2">
						{price !== null && (
							<span
								className="text-[22px] font-black leading-none tracking-tight"
								style={{ color: ORANGE }}
							>
								{price}
							</span>
						)}
					</div>
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
		</div>
	);
}

export default function MonthlyDeals() {
	const discounts = useDiscounts();

	// Show only active discounts
	const activeDiscounts = useMemo(() => {
		const now = Date.now();
		return discounts.filter((d) => d.active && d.startDate <= now && d.endDate >= now);
	}, [discounts]);

	if (!activeDiscounts.length) return null;

	return (
		<section className="py-20 lg:py-28" style={{ background: "var(--background)" }}>
			<div className="container mx-auto px-4">
				{/* Row head */}
				<div className="mb-[60px] flex flex-wrap items-end justify-between gap-7">
					<div>
						<div
							className="mb-5 inline-flex items-center gap-3.5 text-[11px] font-bold uppercase tracking-[0.18em]"
							style={{ color: ORANGE }}
						>
							<span className="h-px w-6" style={{ background: ORANGE }} />
							מבצע חודשי
						</div>
						<h2 className="text-[clamp(34px,4.6vw,68px)] font-extrabold leading-none tracking-tight text-[var(--foreground)]">
							המבצעים{" "}
							<em className="font-light italic" style={{ fontFamily: SERIF, color: ORANGE }}>
								של החודש.
							</em>
						</h2>
					</div>
					<span
						className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]"
						style={{ cursor: "default" }}
					>
						בתוקף עד סוף החודש
					</span>
				</div>

				{/* Rail */}
				<div className="relative px-7">
					<div
						className="flex gap-3.5 overflow-x-auto py-2 [scrollbar-width:none] [scroll-behavior:smooth] [scroll-snap-type:x_mandatory]"
						style={{ WebkitOverflowScrolling: "touch" }}
					>
						{activeDiscounts.map((discount) => (
							<DealCard key={discount.id} discount={discount} />
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
