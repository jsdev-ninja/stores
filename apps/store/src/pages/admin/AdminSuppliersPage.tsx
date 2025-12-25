import { useEffect, useState, useCallback } from "react";
import { Button } from "src/components/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { Input } from "@heroui/react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { TSupplier, TNewSupplier } from "@jsdev_ninja/core";

export function AdminSuppliersPage() {
	const { t } = useTranslation(["common", "admin"]);
	const [suppliers, setSuppliers] = useState<TSupplier[]>([]);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editingSupplier, setEditingSupplier] = useState<TSupplier | null>(null);
	const [formData, setFormData] = useState<TNewSupplier>({
		type: "Supplier",
		name: "",
		code: "",
	});

	const appApi = useAppApi();

	const loadSuppliers = useCallback(async () => {
		try {
			const result = await appApi.admin.listSuppliers();
			if (result?.success) {
				setSuppliers((result.data || []) as TSupplier[]);
			}
		} catch (error) {
			console.error("Failed to load suppliers:", error);
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// Load suppliers on component mount
	useEffect(() => {
		loadSuppliers();
	}, [loadSuppliers]);

	const handleCreate = async () => {
		try {
			const result = await appApi.admin.createSupplier(formData);
			if (result?.success) {
				await loadSuppliers();
				setIsCreateModalOpen(false);
				resetForm();
			}
		} catch (error) {
			console.error("Failed to create supplier:", error);
		}
	};

	const handleUpdate = async () => {
		if (!editingSupplier) return;

		try {
			const updatedSupplier: TSupplier = {
				...editingSupplier,
				...formData,
			};
			const result = await appApi.admin.updateSupplier(updatedSupplier);
			if (result?.success) {
				await loadSuppliers();
				setIsEditModalOpen(false);
				setEditingSupplier(null);
				resetForm();
			}
		} catch (error) {
			console.error("Failed to update supplier:", error);
		}
	};

	const handleDelete = async (supplierId: string) => {
		if (window.confirm(t("admin:suppliersPage.confirmDelete"))) {
			try {
				const result = await appApi.admin.deleteSupplier(supplierId);
				if (result?.success) {
					await loadSuppliers();
				}
			} catch (error) {
				console.error("Failed to delete supplier:", error);
			}
		}
	};

	const handleEdit = (supplier: TSupplier) => {
		setEditingSupplier(supplier);
		setFormData({
			...supplier,
		});
		setIsEditModalOpen(true);
	};

	const handleFormChange = (field: keyof TNewSupplier, value: string) => {
		setFormData((prev: TNewSupplier) => ({
			...prev,
			[field]: value,
		}));
	};

	const resetForm = () => {
		setFormData({
			type: "Supplier",
			name: "",
			code: "",
		});
	};

	const handleCloseCreateModal = () => {
		setIsCreateModalOpen(false);
		resetForm();
	};

	const handleCloseEditModal = () => {
		setIsEditModalOpen(false);
		setEditingSupplier(null);
		resetForm();
	};

	return (
		<div className="w-full p-6">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">{t("admin:suppliersPage.title")}</h1>
				<Button
					color="primary"
					onPress={() => setIsCreateModalOpen(true)}
					startContent={<Icon icon="lucide:plus" />}
				>
					{t("admin:suppliersPage.createSupplier")}
				</Button>
			</div>

			<Table aria-label="Suppliers table">
				<TableHeader>
					<TableColumn>{t("admin:suppliersPage.name")}</TableColumn>
					<TableColumn>{t("admin:suppliersPage.code")}</TableColumn>
					<TableColumn>{t("admin:suppliersPage.actionsLabel")}</TableColumn>
				</TableHeader>
				<TableBody>
					{suppliers.map((supplier) => (
						<TableRow key={supplier.id}>
							<TableCell>{supplier.name}</TableCell>
							<TableCell>{supplier.code}</TableCell>
							<TableCell>
								<div className="flex gap-2">
									<Button
										size="sm"
										variant="light"
										onPress={() => handleEdit(supplier)}
										startContent={<Icon icon="lucide:edit" />}
									>
										{t("common:edit")}
									</Button>
									<Button
										size="sm"
										color="danger"
										variant="light"
										onPress={() => handleDelete(supplier.id)}
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
			<Modal isOpen={isCreateModalOpen} onOpenChange={handleCloseCreateModal} size="md">
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								{t("admin:suppliersPage.createSupplier")}
							</ModalHeader>
							<ModalBody>
								<Input
									label={t("admin:suppliersPage.name")}
									placeholder={t("admin:suppliersPage.namePlaceholder")}
									value={formData.name}
									onValueChange={(value) => handleFormChange("name", value)}
									isRequired
								/>
								<Input
									label={t("admin:suppliersPage.code")}
									placeholder={t("admin:suppliersPage.codePlaceholder")}
									value={formData.code}
									onValueChange={(value) => handleFormChange("code", value)}
									isRequired
								/>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									{t("common:cancel")}
								</Button>
								<Button
									color="primary"
									onPress={handleCreate}
									isLoading={appApi.loading["admin.createSupplier"]}
								>
									{t("common:create")}
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>

			{/* Edit Modal */}
			<Modal isOpen={isEditModalOpen} onOpenChange={handleCloseEditModal} size="md">
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								{t("admin:suppliersPage.editSupplier")}
							</ModalHeader>
							<ModalBody>
								<Input
									label={t("admin:suppliersPage.name")}
									placeholder={t("admin:suppliersPage.namePlaceholder")}
									value={formData.name}
									onValueChange={(value) => handleFormChange("name", value)}
									isRequired
								/>
								<Input
									label={t("admin:suppliersPage.code")}
									placeholder={t("admin:suppliersPage.codePlaceholder")}
									value={formData.code}
									onValueChange={(value) => handleFormChange("code", value)}
									isRequired
								/>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									{t("common:cancel")}
								</Button>
								<Button
									color="primary"
									onPress={handleUpdate}
									isLoading={appApi.loading["admin.updateSupplier"]}
								>
									{t("common:save")}
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</div>
	);
}
