import { createContext, useContext } from "react";
import type { StoreListItem } from "src/lib/saContracts";

export type StoreContextValue = {
	stores: StoreListItem[];
	currentStore: StoreListItem | null;
	setCurrentStore: (store: StoreListItem) => void;
	loading: boolean;
	error: string | null;
};

export const StoreContext = createContext<StoreContextValue | null>(null);

export function useStoreContext(): StoreContextValue {
	const ctx = useContext(StoreContext);
	if (!ctx) {
		throw new Error("useStoreContext must be used inside StoreProvider");
	}
	return ctx;
}
