import { useState, useCallback } from "react";
import { saGetDocument, saListCollections } from "src/lib/firebase/callables";

type DocDataState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "error"; message: string }
	| { status: "forbidden" }
	| { status: "success"; data: Record<string, unknown> | null; subcollections: string[] };

export function useDocumentNode(docPath: string) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [docState, setDocState] = useState<DocDataState>({ status: "idle" });

	const loadDoc = useCallback(() => {
		setDocState({ status: "loading" });

		Promise.all([saGetDocument({ path: docPath }), saListCollections({ path: docPath })])
			.then(([docResult, colResult]) => {
				if (!docResult.success) {
					if (docResult.error === "forbidden") {
						setDocState({ status: "forbidden" });
						return;
					}
					setDocState({ status: "error", message: `Error: ${docResult.error}` });
					return;
				}
				if (!colResult.success) {
					if (colResult.error === "forbidden") {
						setDocState({ status: "forbidden" });
						return;
					}
					setDocState({ status: "error", message: `Error: ${colResult.error}` });
					return;
				}
				setDocState({
					status: "success",
					data: docResult.data.data,
					subcollections: colResult.data.collections,
				});
			})
			.catch((err: unknown) => {
				setDocState({
					status: "error",
					message: err instanceof Error ? err.message : "Unknown error",
				});
			});
	}, [docPath]);

	const toggle = useCallback(() => {
		setIsExpanded((prev) => {
			if (!prev && docState.status === "idle") {
				loadDoc();
			}
			return !prev;
		});
	}, [docState.status, loadDoc]);

	return { isExpanded, toggle, docState };
}
