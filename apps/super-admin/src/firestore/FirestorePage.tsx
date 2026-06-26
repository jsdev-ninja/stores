import { useRootCollections } from "./useRootCollections";
import { CollectionNode } from "./CollectionNode";

export function FirestorePage() {
	const { state } = useRootCollections();

	return (
		<div className="max-w-4xl">
			<div className="mb-6">
				<h1 className="text-xl font-semibold text-slate-800">Firestore Browser</h1>
				<p className="text-sm text-slate-500 mt-1">
					Read-only tree view. Expand nodes to lazy-load documents and subcollections.
				</p>
			</div>

			<div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
				{state.status === "loading" && (
					<div className="flex items-center justify-center h-32">
						<div className="h-6 w-6 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
					</div>
				)}

				{state.status === "error" && (
					<div className="px-5 py-4 text-sm text-red-600">
						<p className="font-medium mb-1">Failed to load root collections</p>
						<p>{state.message}</p>
					</div>
				)}

				{state.status === "success" && state.collections.length === 0 && (
					<p className="px-5 py-4 text-sm text-slate-400 italic">No collections found.</p>
				)}

				{state.status === "success" &&
					state.collections.map((colId) => (
						<div key={colId} className="border-b border-slate-100 last:border-b-0">
							<CollectionNode
								collectionId={colId}
								collectionPath={colId}
								depth={0}
							/>
						</div>
					))}
			</div>
		</div>
	);
}
