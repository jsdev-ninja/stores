import { useState } from "react";
import { Modal, Input } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { Button } from "src/components/button";
import { modalApi } from "src/infra/modals";
import { FirebaseAPI, TOrder } from "@jsdev_ninja/core";
import { useApiState } from "src/appApi/useApiState";
import { FirebaseApi } from "src/lib/firebase";

type DeliveryNoteDetailsForm = {
	deliveryNoteDate: string;
};

export function DeliveryNoteDetailsModal({
	selectedOrders,
	onDeliveryNoteCreated,
}: {
	selectedOrders: TOrder[];
	onDeliveryNoteCreated?: () => void;
}) {
	const { t } = useTranslation(["common", "admin"]);
	const { store } = useApiState();
	const [formData, setFormData] = useState<DeliveryNoteDetailsForm>({
		deliveryNoteDate: new Date().toISOString().split("T")[0],
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errors, setErrors] = useState<Partial<Record<keyof DeliveryNoteDetailsForm, string>>>({});

	const validateForm = (): boolean => {
		const newErrors: Partial<Record<keyof DeliveryNoteDetailsForm, string>> = {};

		if (!formData.deliveryNoteDate.trim()) {
			newErrors.deliveryNoteDate = t("admin:deliveryNoteDetails.errors.dateRequired");
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async () => {
		if (!validateForm() || !store) {
			return;
		}

		setIsSubmitting(true);
		try {
			// Create delivery notes for each selected order
			// Note: This will need to be implemented as a callable function
			// For now, we'll update the order status to trigger delivery note creation
			await Promise.all(
				selectedOrders.map(async (order) => {
					// Update order status to trigger delivery note creation
					// This is a temporary solution - should be replaced with a proper API call
					await FirebaseApi.firestore.setV2<{ id: string; doc: Partial<TOrder> }>({
						collection: FirebaseAPI.firestore.getPath({
							companyId: store.companyId,
							storeId: store.id,
							collectionName: "orders",
						}),
						doc: {
							id: order.id,
							status: "in_delivery",
						} as any,
					});
				})
			);

			onDeliveryNoteCreated?.();
			modalApi.closeModal("deliveryNoteDetails");
		} catch (error) {
			console.error("Failed to create delivery notes:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleChange = (field: keyof DeliveryNoteDetailsForm, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
		// Clear error for this field when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({
				...prev,
				[field]: undefined,
			}));
		}
	};

	return (
		<Modal.Backdrop
			isOpen
			onOpenChange={(open) => {
				if (!open) modalApi.closeModal("deliveryNoteDetails");
			}}
		>
			<Modal.Container size="md" scroll="inside">
				<Modal.Dialog>
					<Modal.Header>
						<Modal.Heading>
							<div className="text-start">{t("admin:deliveryNoteDetails.title")}</div>
							<div className="text-sm text-default-500 text-start">
								{t("admin:deliveryNoteDetails.description", {
									count: selectedOrders.length,
								})}
							</div>
						</Modal.Heading>
					</Modal.Header>
					<Modal.Body>
						<div className="space-y-4">
							<div className="flex flex-col gap-1">
								<label className="block text-sm font-medium text-start">
									{t("admin:deliveryNoteDetails.deliveryNoteDate")}
									<span className="text-danger ml-1">*</span>
								</label>
								<Input
									type="date"
									value={formData.deliveryNoteDate}
									onChange={(e) => handleChange("deliveryNoteDate", e.target.value)}
									className="text-start"
								/>
								{errors.deliveryNoteDate && (
									<p className="text-sm text-danger text-start">
										{errors.deliveryNoteDate}
									</p>
								)}
							</div>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button
							variant="danger"
							onPress={() => modalApi.closeModal("deliveryNoteDetails")}
							isDisabled={isSubmitting}
						>
							{t("common:cancel")}
						</Button>
						<Button variant="primary" onPress={handleSubmit} isPending={isSubmitting}>
							{t("admin:deliveryNoteDetails.createDeliveryNote")}
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
