import { useRawJsonPanel } from "./useRawJsonPanel";

type Props = {
	data: unknown;
};

export function RawJsonPanel({ data }: Props) {
	const { isOpen, toggle, json } = useRawJsonPanel(data);

	return (
		<div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
			<button
				type="button"
				onClick={toggle}
				className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors text-left"
			>
				<span>Raw JSON</span>
				<span className="text-slate-400 text-xs">{isOpen ? "▲ Collapse" : "▼ Expand"}</span>
			</button>
			{isOpen && (
				<pre className="overflow-x-auto p-4 text-xs leading-relaxed text-slate-800 font-mono border-t border-slate-200 bg-white">
					{json}
				</pre>
			)}
		</div>
	);
}
