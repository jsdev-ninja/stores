import { useDocumentNode } from "./useDocumentNode";
import { CollectionNode } from "./CollectionNode";

type Props = {
	docId: string;
	docPath: string;
	depth: number;
};

const INDENT_PX = 20;

export function DocumentNode({ docId, docPath, depth }: Props) {
	const { isExpanded, toggle, docState } = useDocumentNode(docPath);

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
				<span className="text-amber-700 font-mono font-medium truncate">{docId}</span>
			</button>

			{isExpanded && (
				<div>
					{docState.status === "loading" && (
						<p
							style={{ paddingLeft: `${indent + 28}px` }}
							className="py-1 text-xs text-slate-400"
						>
							Loading…
						</p>
					)}

					{docState.status === "error" && (
						<p
							style={{ paddingLeft: `${indent + 28}px` }}
							className="py-1 text-xs text-red-500"
						>
							{docState.message}
						</p>
					)}

					{docState.status === "forbidden" && (
						<p
							style={{ paddingLeft: `${indent + 28}px` }}
							className="py-1 text-xs text-slate-400"
						>
							🔒 hidden
						</p>
					)}

					{docState.status === "success" && (
						<>
							{/* Document data */}
							<div
								style={{ paddingLeft: `${indent + 28}px`, paddingRight: "12px" }}
								className="pb-2"
							>
								{docState.data === null ? (
									<p className="text-xs text-slate-400 italic py-1">
										(no data / not found)
									</p>
								) : (
									<pre className="overflow-x-auto text-xs leading-relaxed text-slate-700 font-mono bg-slate-50 border border-slate-200 rounded p-2 mt-1">
										{JSON.stringify(docState.data, null, 2)}
									</pre>
								)}
							</div>

							{/* Subcollections */}
							{docState.subcollections.map((colId) => (
								<CollectionNode
									key={colId}
									collectionId={colId}
									collectionPath={`${docPath}/${colId}`}
									depth={depth + 1}
								/>
							))}

							{docState.subcollections.length === 0 && (
								<p
									style={{ paddingLeft: `${indent + 28}px` }}
									className="py-1 text-xs text-slate-400 italic"
								>
									No subcollections
								</p>
							)}
						</>
					)}
				</div>
			)}
		</div>
	);
}
