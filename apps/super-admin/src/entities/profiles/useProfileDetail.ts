import { useState, useEffect } from "react";
import { saGetProfile } from "src/lib/firebase/callables";
import { useStoreContext } from "src/store-context/StoreContext";
import type { TProfile } from "src/lib/saContracts";

type ProfileDetailState =
	| { status: "loading" }
	| { status: "error"; message: string }
	| { status: "success"; profile: TProfile };

export function useProfileDetail(id: string) {
	const { currentStore } = useStoreContext();
	const [state, setState] = useState<ProfileDetailState>({ status: "loading" });

	useEffect(() => {
		if (!currentStore) return;
		let cancelled = false;
		setState({ status: "loading" });

		saGetProfile({ companyId: currentStore.companyId, storeId: currentStore.id, id })
			.then((result) => {
				if (cancelled) return;
				if (!result.success) {
					setState({
						status: "error",
						message: `Failed to load profile: ${result.error}`,
					});
					return;
				}
				setState({ status: "success", profile: result.data });
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
	}, [id, currentStore]);

	return { state };
}
