import { useEffect, useState } from "react";
import { Button } from "src/components/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { Input } from "@heroui/react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";

// Temporary type definition
type TOrganization = {
	id: string;
	name: string;
	discountPercentage?: number;
	nameOnInvoice?: string;
};

export function AdminOrganizationsPage() {
	// const appApi = useAppApi(); // Will be used when API is fully integrated
	const { t } = useTranslation(["common", "admin"]);
	const [organizations, setOrganizations] = useState<TOrganization[]>([]);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editingOrganization, setEditingOrganization] = useState<TOrganization | null>(null);
	const [formData, setFormData] = useState<Omit<TOrganization, "id">>({
		name: "",
		discountPercentage: undefined,
		nameOnInvoice: "",
	});

	const appApi = useAppApi();

	// Load organizations on component mount
	useEffect(() => {
		loadOrganizations();
	}, []);

	const loadOrganizations = async () => {
		try {
			// For now, using mock data until API is fully integrated
			const result = await appApi.admin.listOrganizations();
			if (result?.success) {
				setOrganizations(result.data || []);
			}
		} catch (error) {
			console.error("Failed to load organizations:", error);
		}
	};

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

	const handleUpdate = async () => {
		if (!editingOrganization) return;

		try {
			const updatedOrg: TOrganization = {
				...editingOrganization,
				...formData,
			};

			const result = await appApi.admin.updateOrganization(updatedOrg);
			if (result?.success) {
				await loadOrganizations();
				setIsEditModalOpen(false);
				setEditingOrganization(null);
				resetForm();
			}
		} catch (error) {
			console.error("Failed to update organization:", error);
		}
	};

	const handleDelete = async (organizationId: string) => {
		if (!confirm(t("admin:organizationsPage.confirmDelete"))) return;

		try {
			const result = await appApi.admin.deleteOrganization(organizationId);
			if (result?.success) {
				await loadOrganizations();
			}
		} catch (error) {
			console.error("Failed to delete organization:", error);
		}
	};

	const openEditModal = (organization: TOrganization) => {
		setEditingOrganization(organization);
		setFormData({
			name: organization.name,
			discountPercentage: organization.discountPercentage,
			nameOnInvoice: organization.nameOnInvoice || "",
		});
		setIsEditModalOpen(true);
	};

	const resetForm = () => {
		setFormData({
			name: "",
			discountPercentage: undefined,
			nameOnInvoice: "",
		});
	};

	const handleFormChange = (field: keyof Omit<TOrganization, "id">, value: string | number) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
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
					<TableColumn>{t("admin:organizationsPage.actions")}</TableColumn>
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
										onPress={() => openEditModal(organization)}
										startContent={<Icon icon="lucide:edit" />}
									>
										{t("edit")}
									</Button>
									<Button
										size="sm"
										color="danger"
										variant="light"
										onPress={() => handleDelete(organization.id)}
										startContent={<Icon icon="lucide:trash" />}
									>
										{t("delete")}
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
							<ModalHeader>
								<h3>{t("admin:organizationsPage.createOrganization")}</h3>
							</ModalHeader>
							<ModalBody>
								<div className="flex flex-col gap-4">
									<Input
										label="Name"
										placeholder="Enter organization name"
										value={formData.name}
										onChange={(e) => handleFormChange("name", e.target.value)}
										isRequired
									/>
									<Input
										label="Discount Percentage"
										placeholder="0-100"
										type="number"
										min="0"
										max="100"
										value={formData.discountPercentage?.toString() || ""}
										onChange={(e) =>
											handleFormChange(
												"discountPercentage",
												parseInt(e.target.value) || 0
											)
										}
									/>
									<Input
										label="Name on Invoice"
										placeholder="Enter invoice name"
										value={formData.nameOnInvoice}
										onChange={(e) => handleFormChange("nameOnInvoice", e.target.value)}
									/>
								</div>
							</ModalBody>
							<ModalFooter>
								<Button variant="light" onPress={onClose}>
									{t("cancel")}
								</Button>
								<Button
									color="primary"
									onPress={handleCreate}
									isDisabled={!formData.name.trim()}
								>
									{t("create")}
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>

			{/* Edit Modal */}
			<Modal isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen} size="md">
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader>
								<h3>{t("admin:organizationsPage.editOrganization")}</h3>
							</ModalHeader>
							<ModalBody>
								<div className="flex flex-col gap-4">
									<Input
										label="Name"
										placeholder="Enter organization name"
										value={formData.name}
										onChange={(e) => handleFormChange("name", e.target.value)}
										isRequired
									/>
									<Input
										label="Discount Percentage"
										placeholder="0-100"
										type="number"
										min="0"
										max="100"
										value={formData.discountPercentage?.toString() || ""}
										onChange={(e) =>
											handleFormChange(
												"discountPercentage",
												parseInt(e.target.value) || 0
											)
										}
									/>
									<Input
										label="Name on Invoice"
										placeholder="Enter invoice name"
										value={formData.nameOnInvoice}
										onChange={(e) => handleFormChange("nameOnInvoice", e.target.value)}
									/>
								</div>
							</ModalBody>
							<ModalFooter>
								<Button variant="light" onPress={onClose}>
									{t("cancel")}
								</Button>
								<Button
									color="primary"
									onPress={handleUpdate}
									isDisabled={!formData.name.trim()}
								>
									{t("save")}
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</div>
	);
}
