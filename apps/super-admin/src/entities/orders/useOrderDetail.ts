import { useState, useEffect, useCallback } from "react";
import { saGetOrder } from "src/lib/firebase/callables";
import { useStoreContext } from "src/store-context/StoreContext";
import type { TOrder } from "src/lib/saContracts";

type OrderDetailState =
	| { status: "loading" }
	| { status: "error"; message: string }
	| { status: "success"; order: TOrder };

export function useOrderDetail(id: string) {
	const { currentStore } = useStoreContext();
	const [state, setState] = useState<OrderDetailState>({ status: "loading" });
	const [fetchKey, setFetchKey] = useState(0);

	useEffect(() => {
		if (!currentStore) return;
		let cancelled = false;
		setState({ status: "loading" });

		saGetOrder({ companyId: currentStore.companyId, storeId: currentStore.id, id })
			.then((result) => {
				if (cancelled) return;
				if (!result.success) {
					setState({
						status: "error",
						message: `Failed to load order: ${result.error}`,
					});
					return;
				}
				setState({ status: "success", order: result.data });
			})
			.catch((err: unknown) => {
				if (cancelled) return;
				setState({
					status: "error",
					message: err instanceof Error ? err.message : "Unknown error",
				});
			});

		return () => {
			cancelled = true;
		};
	}, [id, currentStore, fetchKey]);

	const refetch = useCallback(() => {
		setFetchKey((k) => k + 1);
	}, []);

	return { state, refetch };
}
