import { useState } from "react";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { Input } from "@heroui/react";
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
			placement="top-center"
			onClose={() => modalApi.closeModal("selectDateForDocument")}
			size="md"
		>
			<ModalContent>
				<ModalHeader className="flex flex-col gap-1">
					<h3 className="text-lg font-semibold">{t(titleKey)}</h3>
				</ModalHeader>
				<ModalBody className="p-4 md:p-5">
					<Input
						label={t("ordersPage:orderDetails.documents.documentDate")}
						type="date"
						value={documentDate}
						onValueChange={setDocumentDate}
						variant="bordered"
					/>
				</ModalBody>
				<ModalFooter>
					<Button
						variant="light"
						onPress={() => modalApi.closeModal("selectDateForDocument")}
						isDisabled={isSubmitting}
					>
						{t("common:cancel")}
					</Button>
					<Button color="primary" onPress={handleConfirm} isLoading={isSubmitting}>
						{t("common:confirm")}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
