import { useState, useEffect, useCallback } from "react";
import { saListAuditEntries } from "src/lib/firebase/callables";
import type { AuditEntry, ListAuditReq } from "src/lib/saContracts";

const PAGE_LIMIT = 50;

type AuditLogState =
	| { status: "loading" }
	| { status: "error"; message: string }
	| { status: "success"; entries: AuditEntry[]; nextCursor: string | undefined };

type Props = {
	companyId?: string;
	storeId?: string;
};

export function useAuditLog({ companyId, storeId }: Props) {
	const [state, setState] = useState<AuditLogState>({ status: "loading" });
	const [cursor, setCursor] = useState<string | undefined>(undefined);
	const [fetchKey, setFetchKey] = useState(0);

	useEffect(() => {
		let cancelled = false;
		setState({ status: "loading" });

		const req: ListAuditReq = {
			limit: PAGE_LIMIT,
			// Omit cursor when absent — the callable SDK sends `undefined` as
			// `null`, which the cursor schema (optional string) rejects.
			...(cursor ? { cursor } : {}),
			...(companyId ? { companyId } : {}),
			...(storeId ? { storeId } : {}),
		};

		saListAuditEntries(req)
			.then((result) => {
				if (cancelled) return;
				if (!result.success) {
					setState({
						status: "error",
						message: `Failed to load audit log: ${result.error}`,
					});
					return;
				}
				setState({
					status: "success",
					entries: result.data,
					nextCursor: result.nextCursor,
				});
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
	}, [companyId, storeId, cursor, fetchKey]);

	const loadNextPage = useCallback(() => {
		if (state.status !== "success" || !state.nextCursor) return;
		setCursor(state.nextCursor);
	}, [state]);

	const resetToFirstPage = useCallback(() => {
		setCursor(undefined);
		setFetchKey((k) => k + 1);
	}, []);

	return {
		state,
		loadNextPage,
		resetToFirstPage,
		hasNextPage: state.status === "success" && !!state.nextCursor,
	};
}
