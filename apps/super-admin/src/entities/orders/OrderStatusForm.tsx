import { FormProvider } from "react-hook-form";
import { useOrderStatusForm } from "./useOrderStatusForm";
import type { TOrder } from "src/lib/saContracts";

type Props = {
	companyId: string;
	storeId: string;
	orderId: string;
	currentStatus: TOrder["status"];
	onSuccess: () => void;
};

export function OrderStatusForm({
	companyId,
	storeId,
	orderId,
	currentStatus,
	onSuccess,
}: Props) {
	const {
		methods,
		submitState,
		handleRequestConfirm,
		handleConfirm,
		handleCancel,
		handleDismissResult,
		orderStatuses,
	} = useOrderStatusForm({ companyId, storeId, orderId, currentStatus, onSuccess });

	const watchedStatus = methods.watch("status");
	const isDirty = watchedStatus !== currentStatus;

	return (
		<div className="mt-6 pt-6 border-t border-slate-200">
			<h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
				Edit status
			</h2>

			<FormProvider {...methods}>
				<form onSubmit={methods.handleSubmit(handleRequestConfirm)} className="flex gap-3 items-end">
					<div className="flex flex-col gap-1">
						<label
							htmlFor="order-status-select"
							className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
						>
							New status
						</label>
						<select
							id="order-status-select"
							{...methods.register("status")}
							className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							{orderStatuses.map((s) => (
								<option key={s} value={s}>
									{s}
								</option>
							))}
						</select>
						{methods.formState.errors.status && (
							<p className="text-xs text-red-600">
								{methods.formState.errors.status.message}
							</p>
						)}
					</div>

					<button
						type="submit"
						disabled={!isDirty || submitState.status === "submitting"}
						className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Change status
					</button>
				</form>
			</FormProvider>

			{/* Confirm step */}
			{submitState.status === "confirming" && (
				<div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
					<p className="text-sm font-semibold text-amber-800 mb-1">Confirm status change</p>
					<p className="text-sm text-amber-700 mb-3">
						Set order <span className="font-mono font-semibold">{orderId}</span> status from{" "}
						<span className="font-semibold">{currentStatus}</span> to{" "}
						<span className="font-semibold">{submitState.newStatus}</span>?
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
				<div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
					<div className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
					Saving…
				</div>
			)}

			{submitState.status === "success" && (
				<div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-3">
					<p className="text-sm font-semibold text-green-800">Status updated successfully.</p>
					<button
						onClick={handleDismissResult}
						className="mt-1 text-xs text-green-700 underline"
					>
						Dismiss
					</button>
				</div>
			)}

			{submitState.status === "error" && (
				<div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3">
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
