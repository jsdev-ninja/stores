import { FormProvider } from "react-hook-form";
import { useProductVisibilityForm } from "./useProductVisibilityForm";

type Props = {
	companyId: string;
	storeId: string;
	productId: string;
	currentValue: boolean;
	onSuccess: () => void;
};

export function ProductVisibilityForm({
	companyId,
	storeId,
	productId,
	currentValue,
	onSuccess,
}: Props) {
	const {
		methods,
		submitState,
		handleRequestConfirm,
		handleConfirm,
		handleCancel,
		handleDismissResult,
	} = useProductVisibilityForm({ companyId, storeId, productId, currentValue, onSuccess });

	const watchedValue = methods.watch("isPublished");
	const isDirty = watchedValue !== currentValue;

	return (
		<div>
			<h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
				Visibility
			</h3>

			<FormProvider {...methods}>
				<form onSubmit={methods.handleSubmit(handleRequestConfirm)} className="flex gap-3 items-center">
					<label className="flex items-center gap-2 cursor-pointer select-none">
						<input
							type="checkbox"
							{...methods.register("isPublished")}
							className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
						/>
						<span className="text-sm text-slate-700">Published</span>
					</label>

					<button
						type="submit"
						disabled={!isDirty || submitState.status === "submitting"}
						className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Save
					</button>
				</form>
			</FormProvider>

			{/* Confirm step */}
			{submitState.status === "confirming" && (
				<div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
					<p className="text-sm font-semibold text-amber-800 mb-1">Confirm visibility change</p>
					<p className="text-sm text-amber-700 mb-3">
						Set product <span className="font-mono font-semibold">{productId}</span>{" "}
						to <span className="font-semibold">{submitState.newValue ? "Published" : "Hidden"}</span>?
					</p>
					<div className="flex gap-2">
						<button
							onClick={handleConfirm}
							className="rounded-md bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
						>
							Yes, change it
						</button>
						<button
							onClick={handleCancel}
							className="rounded-md border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
						>
							Cancel
						</button>
					</div>
				</div>
			)}

			{submitState.status === "submitting" && (
				<div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
					<div className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
					Saving…
				</div>
			)}

			{submitState.status === "success" && (
				<div className="mt-3 rounded-lg border border-green-300 bg-green-50 p-3">
					<p className="text-sm font-semibold text-green-800">Visibility updated successfully.</p>
					<button
						onClick={handleDismissResult}
						className="mt-1 text-xs text-green-700 underline"
					>
						Dismiss
					</button>
				</div>
			)}

			{submitState.status === "error" && (
				<div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3">
					<p className="text-sm font-semibold text-red-800">Error</p>
					<p className="text-sm text-red-700">{submitState.message}</p>
					<button
						onClick={handleDismissResult}
						className="mt-1 text-xs text-red-700 underline"
					>
						Dismiss
					</button>
				</div>
			)}
		</div>
	);
}
