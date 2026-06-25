import { useState, useEffect, useCallback } from "react";
import { saListProducts, saSearchProducts } from "src/lib/firebase/callables";
import { useStoreContext } from "src/store-context/StoreContext";
import type { ProductListRow, SearchProductsReq } from "src/lib/saContracts";

const PAGE_LIMIT = 50;

type SearchState =
	| { mode: "list" }
	| { mode: "search"; req: Omit<SearchProductsReq, "companyId" | "storeId"> };

export type ProductsListState =
	| { status: "loading" }
	| { status: "error"; message: string }
	| { status: "success"; rows: ProductListRow[]; nextCursor: string | undefined };

export function useProductsList() {
	const { currentStore } = useStoreContext();
	const [searchState, setSearchState] = useState<SearchState>({ mode: "list" });
	const [state, setState] = useState<ProductsListState>({ status: "loading" });

	const load = useCallback(
		async (cursor?: string) => {
			if (!currentStore) return;
			// Only show spinner on initial/search load, not on load-more
			if (!cursor) setState({ status: "loading" });
			try {
				const result =
					searchState.mode === "search"
						? await saSearchProducts({
								companyId: currentStore.companyId,
								storeId: currentStore.id,
								...searchState.req,
							})
						: await saListProducts({
								companyId: currentStore.companyId,
								storeId: currentStore.id,
								limit: PAGE_LIMIT,
								cursor,
							});

				if (!result.success) {
					setState({ status: "error", message: `Failed to load products: ${result.error}` });
					return;
				}
				setState((prev) => ({
					status: "success",
					// Append on load-more (cursor present), replace on fresh load
					rows:
						cursor && prev.status === "success"
							? [...prev.rows, ...result.data]
							: result.data,
					nextCursor: result.nextCursor,
				}));
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
		(req: Omit<SearchProductsReq, "companyId" | "storeId">) => {
			setSearchState({ mode: "search", req });
		},
		[]
	);

	const handleClearSearch = useCallback(() => {
		setSearchState({ mode: "list" });
	}, []);

	const handleLoadMore = useCallback(() => {
		if (state.status !== "success" || !state.nextCursor) return;
		void load(state.nextCursor);
	}, [state, load]);

	return { state, searchState, handleSearch, handleClearSearch, handleLoadMore };
}
