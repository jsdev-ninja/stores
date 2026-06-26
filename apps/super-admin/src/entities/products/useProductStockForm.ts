import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { saSetProductStock } from "src/lib/firebase/callables";
import type { SuperAdminError } from "src/lib/saContracts";

// Mirror ProductSchema.stock.quantity — non-negative number
const StockFormSchema = z.object({
	quantity: z.number({ invalid_type_error: "Quantity must be a number." }).min(0, "Quantity must be 0 or more."),
});

type StockFormValues = z.infer<typeof StockFormSchema>;

const ERROR_MESSAGES: Record<SuperAdminError, string> = {
	unauthorized: "You do not have permission to perform this action.",
	invalid_input: "Invalid quantity.",
	not_found: "Product not found.",
	invalid_status: "Invalid status.",
	stock_uninitialized:
		"This product has no stock object — it must be initialized before it can be updated here.",
	forbidden: "Access to this resource is not allowed.",
	internal: "An internal error occurred. Please try again.",
};

type SubmitState =
	| { status: "idle" }
	| { status: "confirming"; newQuantity: number }
	| { status: "submitting" }
	| { status: "success" }
	| { status: "error"; message: string };

type Props = {
	companyId: string;
	storeId: string;
	productId: string;
	currentQuantity: number | null;
	onSuccess: () => void;
};

export function useProductStockForm({
	companyId,
	storeId,
	productId,
	currentQuantity,
	onSuccess,
}: Props) {
	const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

	const methods = useForm<StockFormValues>({
		resolver: zodResolver(StockFormSchema),
		defaultValues: { quantity: currentQuantity ?? 0 },
	});

	const handleRequestConfirm = useCallback(
		(values: StockFormValues) => {
			if (values.quantity === currentQuantity) return;
			setSubmitState({ status: "confirming", newQuantity: values.quantity });
		},
		[currentQuantity]
	);

	const handleConfirm = useCallback(async () => {
		if (submitState.status !== "confirming") return;
		const { newQuantity } = submitState;
		setSubmitState({ status: "submitting" });

		try {
			const result = await saSetProductStock({
				companyId,
				storeId,
				id: productId,
				quantity: newQuantity,
			});

			if (!result.success) {
				setSubmitState({
					status: "error",
					message: ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.internal,
				});
				return;
			}

			setSubmitState({ status: "success" });
			onSuccess();
		} catch {
			setSubmitState({ status: "error", message: ERROR_MESSAGES.internal });
		}
	}, [submitState, companyId, storeId, productId, onSuccess]);

	const handleCancel = useCallback(() => {
		setSubmitState({ status: "idle" });
	}, []);

	const handleDismissResult = useCallback(() => {
		setSubmitState({ status: "idle" });
	}, []);

	return {
		methods,
		submitState,
		handleRequestConfirm,
		handleConfirm,
		handleCancel,
		handleDismissResult,
	};
}
