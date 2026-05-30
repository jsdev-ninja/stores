import { useState } from "react";
import { Modal, Input } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { Button } from "src/components/button";
import { modalApi } from "src/infra/modals";

type DocumentType = "deliveryNote" | "invoice";

export function SelectDateForDocumentModal({
	documentType,
	onConfirm,
}: {
	documentType: DocumentType;
	onConfirm: (date: number) => void | Promise<void>;
}) {
	const { t } = useTranslation(["ordersPage", "common"]);
	const [documentDate, setDocumentDate] = useState<string>(
		new Date().toISOString().split("T")[0]
	);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const titleKey =
		documentType === "deliveryNote"
			? "ordersPage:orderDetails.documents.selectDateDeliveryNote"
			: "ordersPage:orderDetails.documents.selectDateInvoice";

	const handleConfirm = async () => {
		setIsSubmitting(true);
		try {
			// Use ISO date string → parsed as UTC midnight (avoids local-tz off-by-one)
			const dateTimestamp = new Date(documentDate).getTime();
			await onConfirm(dateTimestamp);
			modalApi.closeModal("selectDateForDocument");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal
			isOpen
			onOpenChange={(open) => {
				if (!open) modalApi.closeModal("selectDateForDocument");
			}}
		>
			<Modal.Backdrop />
			<Modal.Container size="md">
				<Modal.Dialog>
					<Modal.Header>
						<Modal.Title>
							<h3 className="text-lg font-semibold">{t(titleKey)}</h3>
						</Modal.Title>
					</Modal.Header>
					<Modal.Body className="p-4 md:p-5">
						<div className="flex flex-col gap-1">
							<label className="block text-sm font-medium">
								{t("ordersPage:orderDetails.documents.documentDate")}
							</label>
							<Input
								type="date"
								value={documentDate}
								onChange={(e) => setDocumentDate(e.target.value)}
							/>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button
							variant="ghost"
							onPress={() => modalApi.closeModal("selectDateForDocument")}
							isDisabled={isSubmitting}
						>
							{t("common:cancel")}
						</Button>
						<Button variant="primary" onPress={handleConfirm} isPending={isSubmitting}>
							{t("common:confirm")}
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal>
	);
}
