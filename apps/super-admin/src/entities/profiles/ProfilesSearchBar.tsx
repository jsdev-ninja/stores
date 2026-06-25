import { useProfilesSearchBar } from "./useProfilesSearchBar";
import type { SearchProfilesReq } from "src/lib/saContracts";

type Props = {
	onSearch: (req: Omit<SearchProfilesReq, "companyId" | "storeId">) => void;
	onClear: () => void;
};

export function ProfilesSearchBar({ onSearch, onClear }: Props) {
	const { fields, handleChange, handleSubmit, handleClear } = useProfilesSearchBar({
		onSearch,
		onClear,
	});

	return (
		<form
			onSubmit={handleSubmit}
			className="flex flex-wrap items-end gap-3 p-4 bg-white rounded-lg border border-slate-200 mb-4"
		>
			<div className="flex flex-col gap-1">
				<label htmlFor="profile-search-email" className="text-xs font-medium text-slate-600">
					Email (exact)
				</label>
				<input
					id="profile-search-email"
					type="email"
					value={fields.byEmail}
					onChange={(e) => handleChange("byEmail", e.target.value)}
					placeholder="user@example.com"
					className="border border-slate-300 rounded-md px-3 py-1.5 text-sm w-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div className="flex flex-col gap-1">
				<label htmlFor="profile-search-phone" className="text-xs font-medium text-slate-600">
					Phone (exact)
				</label>
				<input
					id="profile-search-phone"
					type="tel"
					value={fields.byPhone}
					onChange={(e) => handleChange("byPhone", e.target.value)}
					placeholder="+972..."
					className="border border-slate-300 rounded-md px-3 py-1.5 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<button
				type="submit"
				className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
			>
				Search
			</button>
			<button
				type="button"
				onClick={handleClear}
				className="px-4 py-1.5 bg-slate-100 text-slate-700 text-sm rounded-md hover:bg-slate-200 transition-colors"
			>
				Clear
			</button>
		</form>
	);
}
