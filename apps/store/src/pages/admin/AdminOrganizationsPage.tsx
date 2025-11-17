import { useEffect, useState, useCallback } from "react";
import { Button } from "src/components/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { Input } from "@heroui/react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { TOrganization, TNewOrganization } from "@jsdev_ninja/core";
import { navigate } from "src/navigation";


export function AdminOrganizationsPage() {
	// const appApi = useAppApi(); // Will be used when API is fully integrated
	const { t } = useTranslation(["common", "admin"]);
	const [organizations, setOrganizations] = useState<TOrganization[]>([]);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [formData, setFormData] = useState<TNewOrganization>({
		name: "",
		discountPercentage: undefined,
		nameOnInvoice: "",
		billingAccounts: [],
		paymentType: "default",
	});

	const appApi = useAppApi();

	const loadOrganizations = useCallback(async () => {
		try {
			// For now, using mock data until API is fully integrated
			const result = await appApi.admin.listOrganizations();
			if (result?.success) {
				setOrganizations((result.data || []) as TOrganization[]);
			}
		} catch (error) {
			console.error("Failed to load organizations:", error);
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// Load organizations on component mount
	useEffect(() => {
		loadOrganizations();
	}, [loadOrganizations]);

	const handleCreate = async () => {
		try {
			const result = await appApi.admin.createOrganization(formData);
			if (result?.success) {
				await loadOrganizations();
				setIsCreateModalOpen(false);
				resetForm();
			}
		} catch (error) {
			console.error("Failed to create organization:", error);
		}
	};

	const handleDelete = async (organizationId: string) => {
		if (window.confirm(t("admin:organizationsPage.confirmDelete"))) {
			try {
				const result = await appApi.admin.deleteOrganization(organizationId);
				if (result?.success) {
					await loadOrganizations();
				}
			} catch (error) {
				console.error("Failed to delete organization:", error);
			}
		}
	};

	const handleFormChange = (field: keyof Omit<TOrganization, "id">, value: string | number | undefined) => {
		setFormData((prev: TNewOrganization) => ({
			...prev,
			[field]: value,
		}));
	};

	const resetForm = () => {
		setFormData({
			name: "",
			paymentType: "default",
			discountPercentage: undefined,
			nameOnInvoice: "",
			billingAccounts: [],
		});
	};

	const handleViewDetails = (organizationId: string) => {
		navigate({ to: "admin.organization", params: { id: organizationId } });
	};

	return (
		<div className="w-full p-6">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">{t("admin:organizationsPage.title")}</h1>
				<Button
					color="primary"
					onPress={() => setIsCreateModalOpen(true)}
					startContent={<Icon icon="lucide:plus" />}
				>
					{t("admin:organizationsPage.createOrganization")}
				</Button>
			</div>

			<Table aria-label="Organizations table">
				<TableHeader>
					<TableColumn>{t("admin:organizationsPage.name")}</TableColumn>
					<TableColumn>{t("admin:organizationsPage.discountPercentage")}</TableColumn>
					<TableColumn>{t("admin:organizationsPage.nameOnInvoice")}</TableColumn>
					<TableColumn>{t("admin:organizationsPage.actionsLabel")}</TableColumn>
				</TableHeader>
				<TableBody>
					{organizations.map((organization) => (
						<TableRow key={organization.id}>
							<TableCell>{organization.name}</TableCell>
							<TableCell>
								{organization.discountPercentage
									? `${organization.discountPercentage}%`
									: "-"}
							</TableCell>
							<TableCell>{organization.nameOnInvoice || "-"}</TableCell>
							<TableCell>
								<div className="flex gap-2">
									<Button
										size="sm"
										variant="light"
										onPress={() => handleViewDetails(organization.id)}
										startContent={<Icon icon="lucide:eye" />}
									>
										{t("admin:organizationsPage.actions.view")}
									</Button>
									<Button
										size="sm"
										color="danger"
										variant="light"
										onPress={() => handleDelete(organization.id)}
										startContent={<Icon icon="lucide:trash" />}
									>
										{t("common:delete")}
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			{/* Create Modal */}
			<Modal isOpen={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} size="md">
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								{t("admin:organizationsPage.createOrganization")}
							</ModalHeader>
							<ModalBody>
								<Input
									label={t("admin:organizationsPage.name")}
									placeholder={t("admin:organizationsPage.namePlaceholder")}
									value={formData.name}
									onValueChange={(value) => handleFormChange("name", value)}
									isRequired
								/>
								<Input
									label={t("admin:organizationsPage.discountPercentage")}
									placeholder={t("admin:organizationsPage.discountPercentagePlaceholder")}
									type="number"
									value={formData.discountPercentage?.toString() || ""}
									onValueChange={(value) =>
										handleFormChange("discountPercentage", value ? Number(value) : undefined)
									}
								/>
								<Input
									label={t("admin:organizationsPage.nameOnInvoice")}
									placeholder={t("admin:organizationsPage.nameOnInvoicePlaceholder")}
									value={formData.nameOnInvoice || ""}
									onValueChange={(value) => handleFormChange("nameOnInvoice", value)}
								/>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									{t("common:cancel")}
								</Button>
								<Button color="primary" onPress={handleCreate}>
									{t("common:create")}
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</div>
	);
}
