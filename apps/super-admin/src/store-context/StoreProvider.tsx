import type { ReactNode } from "react";
import { StoreContext } from "./StoreContext";
import { useStoreProvider } from "./useStoreProvider";

type Props = {
	children: ReactNode;
};

export function StoreProvider({ children }: Props) {
	const value = useStoreProvider();
	return (
		<StoreContext.Provider value={value}>
			{children}
		</StoreContext.Provider>
	);
}
