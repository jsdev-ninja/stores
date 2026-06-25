import { useNavigate } from "react-router-dom";
import { useOrdersList } from "./useOrdersList";
import { OrdersSearchBar } from "./OrdersSearchBar";
import { EntityErrorBanner } from "src/entities/shared/EntityErrorBanner";

function formatDate(epochMs: number): string {
	return new Date(epochMs).toLocaleDateString("en-IL", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

const STATUS_COLORS: Record<string, string> = {
	draft: "bg-slate-100 text-slate-600",
	pending: "bg-yellow-100 text-yellow-800",
	processing: "bg-blue-100 text-blue-800",
	in_delivery: "bg-indigo-100 text-indigo-800",
	delivered: "bg-green-100 text-green-800",
	cancelled: "bg-red-100 text-red-800",
	completed: "bg-emerald-100 text-emerald-800",
	refunded: "bg-orange-100 text-orange-800",
};

export function OrdersListPage() {
	const navigate = useNavigate();
	const { state, handleSearch, handleClearSearch, handleLoadMore } = useOrdersList();

	return (
		<div>
			<h1 className="text-xl font-bold text-slate-900 mb-4">Orders</h1>
			<OrdersSearchBar onSearch={handleSearch} onClear={handleClearSearch} />

			{state.status === "loading" && (
				<div className="flex items-center justify-center h-40">
					<div className="h-8 w-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
				</div>
			)}

			{state.status === "error" && <EntityErrorBanner message={state.message} />}

			{state.status === "success" && state.rows.length === 0 && (
				<div className="flex items-center justify-center h-40 text-sm text-slate-500">
					No orders found.
				</div>
			)}

			{state.status === "success" && state.rows.length > 0 && (
				<div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
					<table className="w-full text-sm">
						<thead className="bg-slate-50 border-b border-slate-200">
							<tr>
								<th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
									ID
								</th>
								<th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
									Date
								</th>
								<th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
									Status
								</th>
								<th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
									Payment
								</th>
								<th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
									Customer
								</th>
								<th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
									Total
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{state.rows.map((row) => (
								<tr
									key={row.id}
									onClick={() => navigate(`/orders/${row.id}`)}
									className="hover:bg-slate-50 cursor-pointer transition-colors"
								>
									<td className="px-4 py-3 font-mono text-xs text-slate-700">
										{row.id}
									</td>
									<td className="px-4 py-3 text-slate-600">
										{formatDate(row.date)}
									</td>
									<td className="px-4 py-3">
										<span
											className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[row.status] ?? "bg-slate-100 text-slate-600"}`}
										>
											{row.status}
										</span>
									</td>
									<td className="px-4 py-3 text-slate-600">
										{row.paymentStatus}
									</td>
									<td className="px-4 py-3 text-slate-700">
										{row.customerName ?? <span className="text-slate-400">—</span>}
									</td>
									<td className="px-4 py-3 text-right text-slate-700 font-medium">
										{row.total}
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
