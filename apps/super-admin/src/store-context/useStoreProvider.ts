import { useState, useEffect, useCallback } from "react";
import { saListStores } from "src/lib/firebase/callables";
import type { StoreListItem } from "src/lib/saContracts";

const STORAGE_KEY = "sa_current_store_id";

export function useStoreProvider() {
	const [stores, setStores] = useState<StoreListItem[]>([]);
	const [currentStore, setCurrentStoreState] = useState<StoreListItem | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function load() {
			try {
				const result = await saListStores();
				if (cancelled) return;

				if (!result.success) {
					setError(`Failed to load stores: ${result.error}`);
					setLoading(false);
					return;
				}

				const loaded = result.data;
				setStores(loaded);

				// Restore previously selected store from localStorage
				const storedId = localStorage.getItem(STORAGE_KEY);
				const restored = storedId
					? (loaded.find((s) => s.id === storedId) ?? null)
					: null;
				setCurrentStoreState(restored);
			} catch (err) {
				if (cancelled) return;
				const message =
					err instanceof Error ? err.message : "Unknown error loading stores";
				setError(message);
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		load();
		return () => {
			cancelled = true;
		};
	}, []);

	const setCurrentStore = useCallback((store: StoreListItem) => {
		localStorage.setItem(STORAGE_KEY, store.id);
		setCurrentStoreState(store);
	}, []);

	return { stores, currentStore, setCurrentStore, loading, error };
}
