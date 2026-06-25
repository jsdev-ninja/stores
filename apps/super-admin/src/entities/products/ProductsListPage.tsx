import { useNavigate } from "react-router-dom";
import { useProductsList } from "./useProductsList";
import { ProductsSearchBar } from "./ProductsSearchBar";
import { EntityErrorBanner } from "src/entities/shared/EntityErrorBanner";

export function ProductsListPage() {
	const navigate = useNavigate();
	const { state, handleSearch, handleClearSearch, handleLoadMore } = useProductsList();

	return (
		<div>
			<h1 className="text-xl font-bold text-slate-900 mb-4">Products</h1>
			<ProductsSearchBar onSearch={handleSearch} onClear={handleClearSearch} />

			{state.status === "loading" && (
				<div className="flex items-center justify-center h-40">
					<div className="h-8 w-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
				</div>
			)}

			{state.status === "error" && <EntityErrorBanner message={state.message} />}

			{state.status === "success" && state.rows.length === 0 && (
				<div className="flex items-center justify-center h-40 text-sm text-slate-500">
					No products found.
				</div>
			)}

			{state.status === "success" && state.rows.length > 0 && (
				<div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
					<table className="w-full text-sm">
						<thead className="bg-slate-50 border-b border-slate-200">
							<tr>
								<th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
									SKU
								</th>
								<th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
									Name
								</th>
								<th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
									Published
								</th>
								<th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
									Price
								</th>
								<th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
									Stock
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{state.rows.map((row) => (
								<tr
									key={row.id}
									onClick={() => navigate(`/products/${row.id}`)}
									className="hover:bg-slate-50 cursor-pointer transition-colors"
								>
									<td className="px-4 py-3 font-mono text-xs text-slate-600">
										{row.sku}
									</td>
									<td className="px-4 py-3 text-slate-800 font-medium">
										{row.name}
									</td>
									<td className="px-4 py-3">
										<span
											className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${row.isPublished ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500"}`}
										>
											{row.isPublished ? "Published" : "Hidden"}
										</span>
									</td>
									<td className="px-4 py-3 text-right text-slate-700">
										{row.price}
									</td>
									<td className="px-4 py-3 text-right text-slate-600">
										{row.stockQuantity ?? <span className="text-slate-400">—</span>}
									</td>
								</tr>
							))}
						</tbody>
					</table>

					{state.hasMore && (
						<div className="px-4 py-3 border-t border-slate-200 text-center">
							<button
								type="button"
								onClick={handleLoadMore}
								className="text-sm text-blue-600 hover:text-blue-800 font-medium"
							>
								Load more
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
