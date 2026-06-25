import { useOrdersSearchBar } from "./useOrdersSearchBar";
import type { SearchOrdersReq, TOrder } from "src/lib/saContracts";

type Props = {
	onSearch: (req: Omit<SearchOrdersReq, "companyId" | "storeId">) => void;
	onClear: () => void;
};

export function OrdersSearchBar({ onSearch, onClear }: Props) {
	const { fields, handleChange, handleSubmit, handleClear, isSubmitDisabled } = useOrdersSearchBar({
		onSearch,
		onClear,
	});

	return (
		<form
			onSubmit={handleSubmit}
			className="flex flex-wrap items-end gap-3 p-4 bg-white rounded-lg border border-slate-200 mb-4"
		>
			<div className="flex flex-col gap-1">
				<label htmlFor="order-search-id" className="text-xs font-medium text-slate-600">
					Order ID (exact)
				</label>
				<input
					id="order-search-id"
					type="text"
					value={fields.byId}
					onChange={(e) => handleChange("byId", e.target.value)}
					placeholder="ord_..."
					className="border border-slate-300 rounded-md px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div className="flex flex-col gap-1">
				<label htmlFor="order-search-status" className="text-xs font-medium text-slate-600">
					Status
				</label>
				<select
					id="order-search-status"
					value={fields.byStatus}
					onChange={(e) =>
						handleChange(
							"byStatus",
							e.target.value as TOrder["status"] | ""
						)
					}
					className="border border-slate-300 rounded-md px-3 py-1.5 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="">— any —</option>
					<option value="draft">draft</option>
					<option value="pending">pending</option>
					<option value="processing">processing</option>
					<option value="in_delivery">in_delivery</option>
					<option value="delivered">delivered</option>
					<option value="cancelled">cancelled</option>
					<option value="completed">completed</option>
					<option value="refunded">refunded</option>
				</select>
			</div>

			<button
				type="submit"
				disabled={isSubmitDisabled}
				className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
