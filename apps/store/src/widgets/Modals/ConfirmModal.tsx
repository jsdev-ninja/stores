import { useState } from "react";
import { Modal } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { Button } from "src/components/button";
import { modalApi } from "src/infra/modals";

type Props = {
	title?: string;
	message?: string;
	confirmText?: string;
	cancelText?: string;
	danger?: boolean;
	onConfirm: () => void | Promise<void>;
};

export function ConfirmModal({ title, message, confirmText, cancelText, danger, onConfirm }: Props) {
	const { t } = useTranslation(["common"]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [hasError, setHasError] = useState(false);

	const handleConfirm = async () => {
		setIsSubmitting(true);
		setHasError(false);
		try {
			await onConfirm();
			modalApi.closeModal("confirmModal");
		} catch {
			setHasError(true);
			setIsSubmitting(false);
		}
	};

	return (
		<Modal.Backdrop
			isOpen
			onOpenChange={(open) => {
				if (!open) modalApi.closeModal("confirmModal");
			}}
		>
			<Modal.Container size="md">
				<Modal.Dialog>
					{title && (
						<Modal.Header>
							<Modal.Heading>
								<h3 className="text-lg font-semibold">{title}</h3>
							</Modal.Heading>
						</Modal.Header>
					)}
					{(message || hasError) && (
						<Modal.Body className="p-4 md:p-5">
							{message && <p className="text-sm text-gray-700">{message}</p>}
							{hasError && <p className="text-sm text-red-600 mt-2">אירעה שגיאה. נסה שוב.</p>}
						</Modal.Body>
					)}
					<Modal.Footer>
						<Button
							variant="ghost"
							onPress={() => modalApi.closeModal("confirmModal")}
							isDisabled={isSubmitting}
						>
							{cancelText ?? t("common:cancel")}
						</Button>
						<Button
							variant={danger ? "danger" : "primary"}
							onPress={handleConfirm}
							isPending={isSubmitting}
							isDisabled={isSubmitting}
						>
							{confirmText ?? t("common:confirm")}
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
