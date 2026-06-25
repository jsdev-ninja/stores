import { useState, useEffect, useCallback } from "react";
import { saGetProduct } from "src/lib/firebase/callables";
import { useStoreContext } from "src/store-context/StoreContext";
import type { TProduct } from "src/lib/saContracts";

type ProductDetailState =
	| { status: "loading" }
	| { status: "error"; message: string }
	| { status: "success"; product: TProduct };

export function useProductDetail(id: string) {
	const { currentStore } = useStoreContext();
	const [state, setState] = useState<ProductDetailState>({ status: "loading" });
	const [fetchKey, setFetchKey] = useState(0);

	useEffect(() => {
		if (!currentStore) return;
		let cancelled = false;
		setState({ status: "loading" });

		saGetProduct({ companyId: currentStore.companyId, storeId: currentStore.id, id })
			.then((result) => {
				if (cancelled) return;
				if (!result.success) {
					setState({
						status: "error",
						message: `Failed to load product: ${result.error}`,
					});
					return;
				}
				setState({ status: "success", product: result.data });
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
