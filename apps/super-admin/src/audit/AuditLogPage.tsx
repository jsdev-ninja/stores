import { useState, useCallback } from "react";
import { useAuditLog } from "./useAuditLog";
import { useStoreContext } from "src/store-context/StoreContext";
import { EntityErrorBanner } from "src/entities/shared/EntityErrorBanner";
import type { AuditEntry } from "src/lib/saContracts";

function formatTs(epochMs: number): string {
	return new Date(epochMs).toLocaleString("en-IL");
}

function formatOldNew(val: string | number | boolean | null): string {
	if (val === null) return "—";
	return String(val);
}

function AuditRow({ entry }: { entry: AuditEntry }) {
	return (
		<tr className="border-b border-slate-100 hover:bg-slate-50">
			<td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">
				{formatTs(entry.timestamp)}
			</td>
			<td className="px-3 py-2 text-xs text-slate-700">
				{entry.actorEmail ?? entry.actorUid}
			</td>
			<td className="px-3 py-2 text-xs font-medium text-slate-800">
				{entry.action}
			</td>
			<td className="px-3 py-2 text-xs text-slate-600 font-mono">
				{entry.companyId}/{entry.storeId}
			</td>
			<td className="px-3 py-2 text-xs text-slate-600">
				{entry.collection}
			</td>
			<td className="px-3 py-2 text-xs font-mono text-slate-600 max-w-[120px] truncate" title={entry.docId}>
				{entry.docId}
			</td>
			<td className="px-3 py-2 text-xs text-slate-600">
				{entry.field}
			</td>
			<td className="px-3 py-2 text-xs text-slate-500">
				{formatOldNew(entry.oldValue)}
			</td>
			<td className="px-3 py-2 text-xs font-medium text-slate-800">
				{formatOldNew(entry.newValue)}
			</td>
		</tr>
	);
}

export function AuditLogPage() {
	const { currentStore } = useStoreContext();
	const [filterToStore, setFilterToStore] = useState(false);

	const companyId = filterToStore && currentStore ? currentStore.companyId : undefined;
	const storeId = filterToStore && currentStore ? currentStore.id : undefined;

	const { state, loadNextPage, resetToFirstPage, hasNextPage } = useAuditLog({ companyId, storeId });

	const handleToggleFilter = useCallback(() => {
		setFilterToStore((f) => !f);
		resetToFirstPage();
	}, [resetToFirstPage]);

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-xl font-bold text-slate-900">Audit log</h1>

				{currentStore && (
					<label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-700">
						<input
							type="checkbox"
							checked={filterToStore}
							onChange={handleToggleFilter}
							className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
						/>
						Filter to current store ({currentStore.name})
					</label>
				)}
			</div>

			{state.status === "loading" && (
				<div className="flex items-center justify-center h-40">
					<div className="h-8 w-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
				</div>
			)}

			{state.status === "error" && <EntityErrorBanner message={state.message} />}

			{state.status === "success" && (
				<>
					{state.entries.length === 0 ? (
						<div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
							<p className="text-sm text-slate-500">No audit entries found.</p>
						</div>
					) : (
						<div className="rounded-lg border border-slate-200 bg-white overflow-x-auto">
							<table className="w-full text-sm min-w-[900px]">
								<thead className="bg-slate-50 border-b border-slate-200">
									<tr>
										<th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 whitespace-nowrap">Timestamp</th>
										<th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Actor</th>
										<th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Action</th>
										<th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Company/Store</th>
										<th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Collection</th>
										<th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Doc ID</th>
										<th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Field</th>
										<th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Old</th>
										<th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">New</th>
									</tr>
								</thead>
								<tbody>
									{state.entries.map((entry) => (
										<AuditRow key={entry.id} entry={entry} />
									))}
								</tbody>
							</table>
						</div>
					)}

					{hasNextPage && (
						<div className="mt-4 flex justify-center">
							<button
								onClick={loadNextPage}
								className="rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
							>
								Load more
							</button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
