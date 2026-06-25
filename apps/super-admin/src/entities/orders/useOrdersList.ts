import { useState, useEffect, useCallback } from "react";
import { saListOrders, saSearchOrders } from "src/lib/firebase/callables";
import { useStoreContext } from "src/store-context/StoreContext";
import type { OrderListRow, SearchOrdersReq } from "src/lib/saContracts";

const PAGE_LIMIT = 50;

type SearchState =
	| { mode: "list" }
	| { mode: "search"; req: Omit<SearchOrdersReq, "companyId" | "storeId"> };

export type OrdersListState =
	| { status: "loading" }
	| { status: "error"; message: string }
	| { status: "success"; rows: OrderListRow[]; hasMore: boolean };

export function useOrdersList() {
	const { currentStore } = useStoreContext();
	const [searchState, setSearchState] = useState<SearchState>({ mode: "list" });
	const [state, setState] = useState<OrdersListState>({ status: "loading" });

	const load = useCallback(
		async (cursor?: string) => {
			if (!currentStore) return;
			setState({ status: "loading" });
			try {
				const result =
					searchState.mode === "search"
						? await saSearchOrders({
								companyId: currentStore.companyId,
								storeId: currentStore.id,
								...searchState.req,
							})
						: await saListOrders({
								companyId: currentStore.companyId,
								storeId: currentStore.id,
								limit: PAGE_LIMIT,
								cursor,
							});

				if (!result.success) {
					setState({ status: "error", message: `Failed to load orders: ${result.error}` });
					return;
				}
				setState({
					status: "success",
					rows: result.data,
					hasMore: result.nextCursor !== undefined,
				});
			} catch (err) {
				setState({
					status: "error",
					message: err instanceof Error ? err.message : "Unknown error",
				});
			}
		},
		[currentStore, searchState]
	);

	useEffect(() => {
		void load(undefined);
	}, [load]);

	const handleSearch = useCallback(
		(req: Omit<SearchOrdersReq, "companyId" | "storeId">) => {
			setSearchState({ mode: "search", req });
		},
		[]
	);

	const handleClearSearch = useCallback(() => {
		setSearchState({ mode: "list" });
	}, []);

	const handleLoadMore = useCallback(() => {
		const lastCursor =
			state.status === "success" && state.hasMore
				? (state.rows[state.rows.length - 1]?.id ?? undefined)
				: undefined;
		if (lastCursor) void load(lastCursor);
	}, [state, load]);

	return { state, searchState, handleSearch, handleClearSearch, handleLoadMore };
}
