import { useState, useEffect, useCallback } from "react";
import { saListProfiles, saSearchProfiles } from "src/lib/firebase/callables";
import { useStoreContext } from "src/store-context/StoreContext";
import type { ProfileListRow, SearchProfilesReq } from "src/lib/saContracts";

const PAGE_LIMIT = 50;

type SearchState =
	| { mode: "list" }
	| { mode: "search"; req: Omit<SearchProfilesReq, "companyId" | "storeId"> };

export type ProfilesListState =
	| { status: "loading" }
	| { status: "error"; message: string }
	| { status: "success"; rows: ProfileListRow[]; nextCursor: string | undefined };

export function useProfilesList() {
	const { currentStore } = useStoreContext();
	const [searchState, setSearchState] = useState<SearchState>({ mode: "list" });
	const [state, setState] = useState<ProfilesListState>({ status: "loading" });

	const load = useCallback(
		async (cursor?: string) => {
			if (!currentStore) return;
			// Only show spinner on initial/search load, not on load-more
			if (!cursor) setState({ status: "loading" });
			try {
				const result =
					searchState.mode === "search"
						? await saSearchProfiles({
								companyId: currentStore.companyId,
								storeId: currentStore.id,
								...searchState.req,
							})
						: await saListProfiles({
								companyId: currentStore.companyId,
								storeId: currentStore.id,
								limit: PAGE_LIMIT,
								cursor,
							});

				if (!result.success) {
					setState({ status: "error", message: `Failed to load profiles: ${result.error}` });
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
		(req: Omit<SearchProfilesReq, "companyId" | "storeId">) => {
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
