import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { saSetProductVisibility } from "src/lib/firebase/callables";
import type { SuperAdminError } from "src/lib/saContracts";

const VisibilityFormSchema = z.object({
	isPublished: z.boolean(),
});

type VisibilityFormValues = z.infer<typeof VisibilityFormSchema>;

const ERROR_MESSAGES: Record<SuperAdminError, string> = {
	unauthorized: "You do not have permission to perform this action.",
	invalid_input: "Invalid input.",
	not_found: "Product not found.",
	invalid_status: "Invalid status.",
	stock_uninitialized: "Stock is not initialized.",
	forbidden: "Access to this resource is not allowed.",
	internal: "An internal error occurred. Please try again.",
};

type SubmitState =
	| { status: "idle" }
	| { status: "confirming"; newValue: boolean }
	| { status: "submitting" }
	| { status: "success" }
	| { status: "error"; message: string };

type Props = {
	companyId: string;
	storeId: string;
	productId: string;
	currentValue: boolean;
	onSuccess: () => void;
};

export function useProductVisibilityForm({
	companyId,
	storeId,
	productId,
	currentValue,
	onSuccess,
}: Props) {
	const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

	const methods = useForm<VisibilityFormValues>({
		resolver: zodResolver(VisibilityFormSchema),
		defaultValues: { isPublished: currentValue },
	});

	const handleRequestConfirm = useCallback(
		(values: VisibilityFormValues) => {
			if (values.isPublished === currentValue) return;
			setSubmitState({ status: "confirming", newValue: values.isPublished });
		},
		[currentValue]
	);

	const handleConfirm = useCallback(async () => {
		if (submitState.status !== "confirming") return;
		const { newValue } = submitState;
		setSubmitState({ status: "submitting" });

		try {
			const result = await saSetProductVisibility({
				companyId,
				storeId,
				id: productId,
				isPublished: newValue,
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
