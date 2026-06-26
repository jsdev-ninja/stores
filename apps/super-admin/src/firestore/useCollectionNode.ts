import { useState, useCallback } from "react";
import { saListDocuments } from "src/lib/firebase/callables";

type DocsState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "error"; message: string }
	| { status: "success"; docs: { id: string }[]; nextCursor: string | undefined };

export function useCollectionNode(collectionPath: string) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [docsState, setDocsState] = useState<DocsState>({ status: "idle" });

	const loadDocs = useCallback(
		(cursor?: string) => {
			setDocsState({ status: "loading" });

			saListDocuments({
				collectionPath,
				limit: 25,
				// Omit cursor when absent — same pattern as useAuditLog
				...(cursor ? { cursor } : {}),
			})
				.then((result) => {
					if (!result.success) {
						setDocsState({ status: "error", message: `Error: ${result.error}` });
						return;
					}
					setDocsState({
						status: "success",
						docs: result.data.docs,
						nextCursor: result.data.nextCursor,
					});
				})
				.catch((err: unknown) => {
					setDocsState({
						status: "error",
						message: err instanceof Error ? err.message : "Unknown error",
					});
				});
		},
		[collectionPath]
	);

	const toggle = useCallback(() => {
		setIsExpanded((prev) => {
			if (!prev && docsState.status === "idle") {
				loadDocs();
			}
			return !prev;
		});
	}, [docsState.status, loadDocs]);

	const loadMore = useCallback(() => {
		if (docsState.status !== "success" || !docsState.nextCursor) return;
		const cursor = docsState.nextCursor;
		setDocsState({ status: "loading" });
		saListDocuments({ collectionPath, limit: 25, cursor })
			.then((result) => {
				if (!result.success) {
					setDocsState({ status: "error", message: `Error: ${result.error}` });
					return;
				}
				setDocsState((prev) => ({
					status: "success",
					docs: prev.status === "success" ? [...prev.docs, ...result.data.docs] : result.data.docs,
					nextCursor: result.data.nextCursor,
				}));
			})
			.catch((err: unknown) => {
				setDocsState({
					status: "error",
					message: err instanceof Error ? err.message : "Unknown error",
				});
			});
	}, [collectionPath, docsState]);

	return {
		isExpanded,
		toggle,
		docsState,
		loadMore,
		hasMore: docsState.status === "success" && !!docsState.nextCursor,
	};
}
