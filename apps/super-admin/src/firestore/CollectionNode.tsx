import { useCollectionNode } from "./useCollectionNode";
import { DocumentNode } from "./DocumentNode";

type Props = {
	collectionId: string;
	collectionPath: string;
	depth: number;
};

const INDENT_PX = 20;

export function CollectionNode({ collectionId, collectionPath, depth }: Props) {
	const { isExpanded, toggle, docsState, loadMore, hasMore } = useCollectionNode(collectionPath);

	const indent = depth * INDENT_PX;

	return (
		<div>
			<button
				type="button"
				onClick={toggle}
				style={{ paddingLeft: `${indent + 8}px` }}
				className="w-full flex items-center gap-2 py-1.5 pr-3 text-sm text-left hover:bg-slate-100 transition-colors"
				aria-expanded={isExpanded}
			>
				<span className="text-slate-400 w-3 shrink-0 text-center">
					{isExpanded ? "▾" : "▸"}
				</span>
				<span className="text-blue-700 font-mono font-semibold truncate">{collectionId}</span>
				<span className="text-slate-400 text-xs">/</span>
			</button>

			{isExpanded && (
				<div>
					{docsState.status === "loading" && (
						<p
							style={{ paddingLeft: `${indent + 28}px` }}
							className="py-1 text-xs text-slate-400"
						>
							Loading…
						</p>
					)}

					{docsState.status === "error" && (
						<p
							style={{ paddingLeft: `${indent + 28}px` }}
							className="py-1 text-xs text-red-500"
						>
							{docsState.message}
						</p>
					)}

					{docsState.status === "success" && docsState.docs.length === 0 && (
						<p
							style={{ paddingLeft: `${indent + 28}px` }}
							className="py-1 text-xs text-slate-400 italic"
						>
							Empty collection
						</p>
					)}

					{docsState.status === "success" &&
						docsState.docs.map((doc) => (
							<DocumentNode
								key={doc.id}
								docId={doc.id}
								docPath={`${collectionPath}/${doc.id}`}
								depth={depth + 1}
							/>
						))}

					{hasMore && (
						<button
							type="button"
							onClick={loadMore}
							style={{ paddingLeft: `${indent + 28}px` }}
							className="py-1 text-xs text-blue-600 hover:underline"
						>
							Load more…
						</button>
					)}
				</div>
			)}
		</div>
	);
}
