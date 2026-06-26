import { useState, useEffect } from "react";
import { saListCollections } from "src/lib/firebase/callables";

type RootState =
	| { status: "loading" }
	| { status: "error"; message: string }
	| { status: "success"; collections: string[] };

export function useRootCollections() {
	const [state, setState] = useState<RootState>({ status: "loading" });

	useEffect(() => {
		let cancelled = false;
		setState({ status: "loading" });

		saListCollections({})
			.then((result) => {
				if (cancelled) return;
				if (!result.success) {
					setState({ status: "error", message: `Error: ${result.error}` });
					return;
				}
				setState({ status: "success", collections: result.data.collections });
			})
			.catch((err: unknown) => {
				if (cancelled) return;
				setState({
					status: "error",
					message: err instanceof Error ? err.message : "Unknown error",
				});
			});

		return () => {
			cancelled = true;
		};
	}, []);

	return { state };
}
