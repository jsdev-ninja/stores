import { useState, useEffect } from "react";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { Input } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { Button } from "src/components/button";
import { modalApi } from "src/infra/modals";
import { FirebaseAPI, TOrder, TOrganization } from "@jsdev_ninja/core";
import { useAppApi } from "src/appApi";
import { useApiState } from "src/appApi/useApiState";
import { FirebaseApi } from "src/lib/firebase";
import { VAT_TYPE } from "src/lib/firebase/api";

type InvoiceDetailsForm = {
	invoiceDate: string;
	customerName: string;
	customerAddress: string;
};

export function InvoiceDetailsModal({
	selectedOrders,
	onInvoiceCreated,
}: {
	selectedOrders: TOrder[];
	onInvoiceCreated?: () => void;
}) {
	const { t } = useTranslation(["common", "admin"]);
	const appApi = useAppApi();
	const { store } = useApiState();
	const [formData, setFormData] = useState<InvoiceDetailsForm>({
		invoiceDate: new Date().toLocaleDateString("he-IL"),
		customerName: "",
		customerAddress: "",
	});
	const [organizations, setOrganizations] = useState<TOrganization[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errors, setErrors] = useState<Partial<Record<keyof InvoiceDetailsForm, string>>>({});

	useEffect(() => {
		const loadOrganizations = async () => {
			try {
				const result = await appApi.admin.listOrganizations();
				if (result?.success) {
					setOrganizations(result.data || []);
				}
			} catch (error) {
				console.error("Failed to load organizations:", error);
			}
		};
		loadOrganizations();
	}, []);

	// Get organization from first order to pre-fill name on invoice
	useEffect(() => {
		if (selectedOrders.length > 0 && organizations.length > 0) {
			const firstOrder = selectedOrders[0];
			if (firstOrder.organizationId) {
				const org = organizations.find((o) => o.id === firstOrder.organizationId);
				if (org?.nameOnInvoice) {
					setFormData((prev) => {
						// Only set if customerName is empty
						if (!prev.customerName) {
							return {
								...prev,
								customerName: org.nameOnInvoice || "",
							};
						}
						return prev;
					});
				}
			}
		}
	}, [selectedOrders, organizations]);

	const validateForm = (): boolean => {
		const newErrors: Partial<Record<keyof InvoiceDetailsForm, string>> = {};

		if (!formData.invoiceDate.trim()) {
			newErrors.invoiceDate = t("admin:invoiceDetails.errors.dateRequired");
		}

		if (!formData.customerName.trim()) {
			newErrors.customerName = t("admin:invoiceDetails.errors.nameRequired");
		}

		if (!formData.customerAddress.trim()) {
			newErrors.customerAddress = t("admin:invoiceDetails.errors.addressRequired");
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
			const res = await FirebaseApi.api.createInvoice(store.id, {
				orders: selectedOrders,
				params: {
					item: selectedOrders.map((order) => ({
						details: `תעודת משלוח ${order?.deliveryNote?.doc_number ?? ""}`,
						price: order?.cart.cartTotal ?? 0,
						amount: 1,
						vat_type: VAT_TYPE.NON,
					})),
					transaction_id: crypto.randomUUID(),
					customer_name: formData.customerName,
					customer_email: selectedOrders[0]?.client?.email || "",
					customer_address: formData.customerAddress,
					customer_phone: selectedOrders[0]?.client?.phoneNumber || "",
					description: "חשבונית עבור הזמנות",
					price_total: selectedOrders.reduce(
						(acc, order) => acc + (order?.cart.cartTotal ?? 0),
						0
					),
					parent: selectedOrders.map((order) => order?.deliveryNote?.doc_uuid).join(","),
					date: formData.invoiceDate,
				},
			});

			if (res.success) {
				onInvoiceCreated?.();
				// update orders with invoice data
				// TODO: should be handle in backend
				await Promise.all(
					selectedOrders.map(async (order) => {
						await FirebaseApi.firestore.setV2<{ id: string; doc: TOrder }>({
							collection: FirebaseAPI.firestore.getPath({
								companyId: store.companyId,
								storeId: store.id,
								collectionName: "orders",
							}),
							doc: {
								id: order.id,
								invoice: {
									...(res.data as any),
									date: new Date(formData.invoiceDate).getTime(),
								},
							} as any,
						});
					})
				);
				modalApi.closeModal("invoiceDetails");
			}
		} catch (error) {
			console.error("Failed to create invoice:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleChange = (field: keyof InvoiceDetailsForm, value: string) => {
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
		<Modal
			isOpen
			onClose={() => modalApi.closeModal("invoiceDetails")}
			size="md"
			scrollBehavior="inside"
		>
			<ModalContent>
				<ModalHeader className="flex flex-col gap-1">
					<div className="text-start">{t("admin:invoiceDetails.title")}</div>
					<div className="text-sm text-default-500 text-start">
						{t("admin:invoiceDetails.description", { count: selectedOrders.length })}
					</div>
				</ModalHeader>
				<ModalBody>
					<div className="space-y-4">
						<Input
							label={t("admin:invoiceDetails.invoiceDate")}
							type="date"
							value={formData.invoiceDate}
							onChange={(e) => handleChange("invoiceDate", e.target.value)}
							isRequired
							isInvalid={!!errors.invoiceDate}
							errorMessage={errors.invoiceDate}
							classNames={{
								input: "text-start",
								label: "text-start",
							}}
						/>
						<Input
							label={t("admin:invoiceDetails.customerName")}
							placeholder={t("admin:invoiceDetails.customerNamePlaceholder")}
							value={formData.customerName}
							onChange={(e) => handleChange("customerName", e.target.value)}
							isRequired
							isInvalid={!!errors.customerName}
							errorMessage={errors.customerName}
							classNames={{
								input: "text-start",
								label: "text-start",
							}}
						/>
						<Input
							label={t("admin:invoiceDetails.customerAddress")}
							placeholder={t("admin:invoiceDetails.customerAddressPlaceholder")}
							value={formData.customerAddress}
							onChange={(e) => handleChange("customerAddress", e.target.value)}
							isRequired
							isInvalid={!!errors.customerAddress}
							errorMessage={errors.customerAddress}
							classNames={{
								input: "text-start",
								label: "text-start",
							}}
						/>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button
						color="danger"
						variant="light"
						onPress={() => modalApi.closeModal("invoiceDetails")}
						isDisabled={isSubmitting}
					>
						{t("common:cancel")}
					</Button>
					<Button color="primary" onPress={handleSubmit} isLoading={isSubmitting}>
						{t("admin:invoiceDetails.createInvoice")}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
