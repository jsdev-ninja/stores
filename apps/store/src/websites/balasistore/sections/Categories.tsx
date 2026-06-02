/**
 * Storefront categories grid — UI port of the Balasi design.
 * Categories now come from Redux (CategorySlice.selectCategories).
 * Only root-level categories (depth 0 or no parentId) are shown.
 * Categories are loaded in App.tsx after appReady+store.id.
 */

import { useMemo } from "react";
import { useAppSelector } from "src/infra";
import { CategorySlice } from "src/domains/Category";
import { TCategory } from "@jsdev_ninja/core";
import { navigate } from "src/navigation";

const ORANGE = "var(--brand-secondary)"; // design --pop
const SERIF = "var(--font-serif)";

const DEFAULT_ICON = "📦";
const RANK_LABELS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"] as const;

function getCategoryName(category: TCategory): string {
	return category.locales.find((l) => l.lang === "he")?.value ?? category.locales[0]?.value ?? "";
}

function CategoryCard({ category, index }: { category: TCategory; index: number }) {
	const name = getCategoryName(category);
	const label = RANK_LABELS[index] ?? String(index + 1).padStart(2, "0");

	return (
		<a
			key={category.id}
			href="#products"
			className="group relative flex cursor-pointer flex-col overflow-hidden border-e border-b border-[var(--border)] p-7"
			onClick={(e) => {
				e.preventDefault();
				navigate({
					to: "store.catalog",
					params: {
						category1: category.id,
						category2: "",
						category3: "",
						category4: "",
					},
				});
			}}
		>
			<span
				className="absolute inset-0 translate-y-full bg-[var(--foreground)] transition-transform duration-300 ease-out group-hover:translate-y-0"
				aria-hidden
			/>
			<span className="relative z-10 mb-9 block text-xs italic" style={{ fontFamily: SERIF, color: ORANGE }}>
				{label}
			</span>
			<span className="relative z-10 mb-6 self-start text-[42px]">{DEFAULT_ICON}</span>
			<h3 className="relative z-10 mb-1.5 text-[22px] font-extrabold leading-tight tracking-tight text-[var(--foreground)] transition-colors group-hover:text-[var(--surface)]">
				{name}
			</h3>
			<span
				className="relative z-10 mt-auto pt-6 text-xl font-extrabold transition-transform group-hover:-translate-x-2"
				style={{ color: ORANGE }}
			>
				←
			</span>
		</a>
	);
}

export default function Categories() {
	const allCategories = useAppSelector(CategorySlice.selectors.selectCategories);

	// Show only root-level categories (no parentId or parentId is null/undefined)
	const rootCategories = useMemo(
		() => allCategories.filter((c) => !c.parentId).slice(0, 8),
		[allCategories],
	);

	if (!rootCategories.length) return null;

	return (
		<section id="categories" className="py-20 lg:py-28" style={{ background: "var(--color-section-alt)" }}>
			<div className="container mx-auto px-4">
				<div className="mb-12 lg:mb-16">
					<div
						className="mb-5 inline-flex items-center gap-3.5 text-[11px] font-bold uppercase tracking-[0.18em]"
						style={{ color: ORANGE }}
					>
						<span className="h-px w-6" style={{ background: ORANGE }} />
						קטגוריות
					</div>
					<h2 className="text-[clamp(34px,4.6vw,68px)] font-extrabold leading-none tracking-tight text-[var(--foreground)]">
						קטגוריות{" "}
						<em className="font-light italic" style={{ fontFamily: SERIF, color: ORANGE }}>
							לכל צורך.
						</em>
					</h2>
				</div>

				<div className="grid grid-cols-2 border-s border-t border-[var(--border)] lg:grid-cols-4">
					{rootCategories.map((category, index) => (
						<CategoryCard key={category.id} category={category} index={index} />
					))}
				</div>
			</div>
		</section>
	);
}
