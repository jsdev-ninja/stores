import { useParams, Link } from "react-router-dom";
import { useProfileDetail } from "./useProfileDetail";
import { EntityErrorBanner } from "src/entities/shared/EntityErrorBanner";
import { RawJsonPanel } from "src/entities/shared/RawJsonPanel";
import type { TProfile } from "src/lib/saContracts";

function LabelValue({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-0.5">
			<dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
				{label}
			</dt>
			<dd className="text-sm text-slate-800">
				{value ?? <span className="text-slate-400">—</span>}
			</dd>
		</div>
	);
}

function ProfileFields({ profile }: { profile: TProfile }) {
	const orgIds = profile.organizationIds ?? (profile.organizationId ? [profile.organizationId] : []);

	return (
		<div className="space-y-6">
			<section>
				<h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
					Profile
				</h2>
				<dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
					<LabelValue label="ID" value={<span className="font-mono text-xs">{profile.id}</span>} />
					<LabelValue label="Display name" value={profile.displayName} />
					<LabelValue label="Email" value={profile.email} />
					<LabelValue label="Phone" value={profile.phoneNumber} />
				</dl>
			</section>

			{orgIds.length > 0 && (
				<section>
					<h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
						Organizations
					</h2>
					<ul className="flex flex-col gap-1">
						{orgIds.map((orgId) => (
							<li
								key={orgId}
								className="font-mono text-xs text-slate-700 bg-slate-50 rounded px-3 py-1.5 border border-slate-200"
							>
								{orgId}
							</li>
						))}
					</ul>
				</section>
			)}
		</div>
	);
}

export function ProfileDetailPage() {
	const { id } = useParams<{ id: string }>();
	const { state } = useProfileDetail(id ?? "");

	return (
		<div>
			<div className="mb-4">
				<Link to="/profiles" className="text-sm text-blue-600 hover:text-blue-800">
					← Back to profiles
				</Link>
			</div>

			<h1 className="text-xl font-bold text-slate-900 mb-6">Profile detail</h1>

			{state.status === "loading" && (
				<div className="flex items-center justify-center h-40">
					<div className="h-8 w-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
				</div>
			)}

			{state.status === "error" && <EntityErrorBanner message={state.message} />}

			{state.status === "success" && (
				<div className="bg-white rounded-lg border border-slate-200 p-6">
					<ProfileFields profile={state.profile} />
					<RawJsonPanel data={state.profile} />
				</div>
			)}
		</div>
	);
}
