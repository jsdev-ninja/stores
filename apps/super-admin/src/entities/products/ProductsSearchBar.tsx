import { useProductsSearchBar } from "./useProductsSearchBar";
import type { SearchProductsReq } from "src/lib/saContracts";

type Props = {
	onSearch: (req: Omit<SearchProductsReq, "companyId" | "storeId">) => void;
	onClear: () => void;
};

export function ProductsSearchBar({ onSearch, onClear }: Props) {
	const { fields, handleChange, handleSubmit, handleClear } = useProductsSearchBar({
		onSearch,
		onClear,
	});

	return (
		<form
			onSubmit={handleSubmit}
			className="flex flex-wrap items-end gap-3 p-4 bg-white rounded-lg border border-slate-200 mb-4"
		>
			<div className="flex flex-col gap-1">
				<label htmlFor="product-search-sku" className="text-xs font-medium text-slate-600">
					SKU (exact match)
				</label>
				<input
					id="product-search-sku"
					type="text"
					value={fields.bySku}
					onChange={(e) => handleChange("bySku", e.target.value)}
					placeholder="SKU-001"
					className="border border-slate-300 rounded-md px-3 py-1.5 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div className="flex flex-col gap-1">
				<label htmlFor="product-search-name" className="text-xs font-medium text-slate-600">
					Name (prefix match)
				</label>
				<input
					id="product-search-name"
					type="text"
					value={fields.byName}
					onChange={(e) => handleChange("byName", e.target.value)}
					placeholder="Product name..."
					className="border border-slate-300 rounded-md px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<button
				type="submit"
				className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
			>
				Search
			</button>
			<button
				type="button"
				onClick={handleClear}
				className="px-4 py-1.5 bg-slate-100 text-slate-700 text-sm rounded-md hover:bg-slate-200 transition-colors"
			>
				Clear
			</button>
		</form>
	);
}
