type Props = {
	message: string;
};

export function EntityErrorBanner({ message }: Props) {
	return (
		<div className="rounded-lg bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
			<p className="font-semibold mb-1">Error</p>
			<p>{message}</p>
		</div>
	);
}
