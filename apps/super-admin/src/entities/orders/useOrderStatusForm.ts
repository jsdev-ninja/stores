import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { saSetOrderStatus } from "src/lib/firebase/callables";
import type { TOrder } from "src/lib/saContracts";
import type { SuperAdminError } from "src/lib/saContracts";

// keep in sync with OrderSchema.shape.status in @jsdev_ninja/core
const ORDER_STATUSES = [
	"draft",
	"pending",
	"processing",
	"in_delivery",
	"delivered",
	"cancelled",
	"completed",
	"refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export { ORDER_STATUSES };

const StatusFormSchema = z.object({
	status: z.enum(ORDER_STATUSES),
});

type StatusFormValues = z.infer<typeof StatusFormSchema>;

const ERROR_MESSAGES: Record<SuperAdminError, string> = {
	unauthorized: "You do not have permission to perform this action.",
	invalid_input: "The selected status is not valid.",
	not_found: "Order not found.",
	invalid_status: "The selected status is not valid for this order.",
	stock_uninitialized: "Stock is not initialized.",
	forbidden: "Access to this resource is not allowed.",
	internal: "An internal error occurred. Please try again.",
};

type SubmitState =
	| { status: "idle" }
	| { status: "confirming"; newStatus: OrderStatus }
	| { status: "submitting" }
	| { status: "success" }
	| { status: "error"; message: string };

type Props = {
	companyId: string;
	storeId: string;
	orderId: string;
	currentStatus: TOrder["status"];
	onSuccess: () => void;
};

export function useOrderStatusForm({
	companyId,
	storeId,
	orderId,
	currentStatus,
	onSuccess,
}: Props) {
	const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

	const methods = useForm<StatusFormValues>({
		resolver: zodResolver(StatusFormSchema),
		defaultValues: { status: currentStatus as OrderStatus },
	});

	const handleRequestConfirm = useCallback(
		(values: StatusFormValues) => {
			if (values.status === currentStatus) return;
			setSubmitState({ status: "confirming", newStatus: values.status });
		},
		[currentStatus]
	);

	const handleConfirm = useCallback(async () => {
		if (submitState.status !== "confirming") return;
		const { newStatus } = submitState;
		setSubmitState({ status: "submitting" });

		try {
			const result = await saSetOrderStatus({
				companyId,
				storeId,
				id: orderId,
				status: newStatus,
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
	}, [submitState, companyId, storeId, orderId, onSuccess]);

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
		orderStatuses: ORDER_STATUSES,
	};
}
