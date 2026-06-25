import type { Key } from "@heroui/react";
import { useCallback } from "react";
import { useStoreContext } from "./StoreContext";

export function useStoreSwitcher() {
	const { stores, currentStore, setCurrentStore } = useStoreContext();

	const handleChange = useCallback(
		(key: Key | null) => {
			if (!key) return;
			const store = stores.find((s) => s.id === String(key));
			if (store) setCurrentStore(store);
		},
		[stores, setCurrentStore]
	);

	return {
		stores,
		currentStoreId: currentStore?.id ?? null,
		handleChange,
	};
}
