import { FormProvider } from "react-hook-form";
import { useProductStockForm } from "./useProductStockForm";

type Props = {
	companyId: string;
	storeId: string;
	productId: string;
	currentQuantity: number | null;
	onSuccess: () => void;
};

export function ProductStockForm({
	companyId,
	storeId,
	productId,
	currentQuantity,
	onSuccess,
}: Props) {
	const {
		methods,
		submitState,
		handleRequestConfirm,
		handleConfirm,
		handleCancel,
		handleDismissResult,
	} = useProductStockForm({ companyId, storeId, productId, currentQuantity, onSuccess });

	const watchedQty = methods.watch("quantity");
	const isDirty = watchedQty !== (currentQuantity ?? 0);

	return (
		<div>
			<h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
				Stock quantity
			</h3>

			<FormProvider {...methods}>
				<form onSubmit={methods.handleSubmit(handleRequestConfirm)} className="flex gap-3 items-end">
					<div className="flex flex-col gap-1">
						<label
							htmlFor="product-stock-input"
							className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
						>
							Quantity
						</label>
						<input
							id="product-stock-input"
							type="number"
							min={0}
							step={1}
							{...methods.register("quantity", { valueAsNumber: true })}
							className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 w-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						{methods.formState.errors.quantity && (
							<p className="text-xs text-red-600">
								{methods.formState.errors.quantity.message}
							</p>
						)}
					</div>

					<button
						type="submit"
						disabled={!isDirty || submitState.status === "submitting"}
						className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Save
					</button>
				</form>
			</FormProvider>

			{/* Confirm step */}
			{submitState.status === "confirming" && (
				<div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
					<p className="text-sm font-semibold text-amber-800 mb-1">Confirm stock change</p>
					<p className="text-sm text-amber-700 mb-3">
						Set product <span className="font-mono font-semibold">{productId}</span> stock from{" "}
						<span className="font-semibold">{currentQuantity ?? "—"}</span> to{" "}
						<span className="font-semibold">{submitState.newQuantity}</span>?
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
					<p className="text-sm font-semibold text-green-800">Stock updated successfully.</p>
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
