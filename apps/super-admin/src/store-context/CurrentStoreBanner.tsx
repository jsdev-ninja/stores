import { useStoreContext } from "./StoreContext";

export function CurrentStoreBanner() {
	const { currentStore } = useStoreContext();

	if (!currentStore) return null;

	return (
		<div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm">
			<span className="text-xs font-bold uppercase tracking-widest text-amber-600">
				Active store
			</span>
			<span className="text-amber-900 font-semibold">
				{currentStore.name}
			</span>
			<span className="text-amber-500 font-mono text-xs">
				{currentStore.companyId}/{currentStore.id}
			</span>
		</div>
	);
}
