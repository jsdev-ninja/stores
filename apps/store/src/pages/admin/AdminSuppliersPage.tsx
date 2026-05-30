import { useEffect, useState, useCallback } from "react";
import { Button } from "src/components/button";
import { Modal, Input, Table } from "@heroui/react";
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
					variant="primary"
					onPress={() => setIsCreateModalOpen(true)}
				>
					<Icon icon="lucide:plus" />
					{t("admin:suppliersPage.createSupplier")}
				</Button>
			</div>

			<Table aria-label="Suppliers table">
				<Table.ScrollContainer>
					<Table.Content>
						<Table.Header>
							<Table.Column isRowHeader>{t("admin:suppliersPage.name")}</Table.Column>
							<Table.Column>{t("admin:suppliersPage.code")}</Table.Column>
							<Table.Column>{t("admin:suppliersPage.actionsLabel")}</Table.Column>
						</Table.Header>
						<Table.Body items={suppliers}>
							{(supplier) => (
								<Table.Row id={supplier.id}>
									<Table.Cell>{supplier.name}</Table.Cell>
									<Table.Cell>{supplier.code}</Table.Cell>
									<Table.Cell>
										<div className="flex gap-2">
											<Button
												variant="ghost"
												onPress={() => handleEdit(supplier)}
											>
												<Icon icon="lucide:edit" />
												{t("common:edit")}
											</Button>
											<Button
												variant="danger"
												onPress={() => handleDelete(supplier.id)}
											>
												<Icon icon="lucide:trash" />
												{t("common:delete")}
											</Button>
										</div>
									</Table.Cell>
								</Table.Row>
							)}
						</Table.Body>
					</Table.Content>
				</Table.ScrollContainer>
			</Table>

			{/* Create Modal */}
			<Modal.Backdrop isOpen={isCreateModalOpen} onOpenChange={handleCloseCreateModal}>
				<Modal.Container>
					<Modal.Dialog>
						<Modal.Header>
							<Modal.Heading>{t("admin:suppliersPage.createSupplier")}</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<div className="flex flex-col gap-4">
								<div className="flex flex-col gap-1">
									<label className="text-sm font-medium text-gray-700">
										{t("admin:suppliersPage.name")}
									</label>
									<Input
										placeholder={t("admin:suppliersPage.namePlaceholder")}
										value={formData.name}
										onChange={(e) => handleFormChange("name", e.target.value)}
										required
									/>
								</div>
								<div className="flex flex-col gap-1">
									<label className="text-sm font-medium text-gray-700">
										{t("admin:suppliersPage.code")}
									</label>
									<Input
										placeholder={t("admin:suppliersPage.codePlaceholder")}
										value={formData.code}
										onChange={(e) => handleFormChange("code", e.target.value)}
										required
									/>
								</div>
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="ghost" onPress={handleCloseCreateModal}>
								{t("common:cancel")}
							</Button>
							<Button
								variant="primary"
								onPress={handleCreate}
								isPending={appApi.loading["admin.createSupplier"]}
							>
								{t("common:create")}
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>

			{/* Edit Modal */}
			<Modal.Backdrop isOpen={isEditModalOpen} onOpenChange={handleCloseEditModal}>
				<Modal.Container>
					<Modal.Dialog>
						<Modal.Header>
							<Modal.Heading>{t("admin:suppliersPage.editSupplier")}</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<div className="flex flex-col gap-4">
								<div className="flex flex-col gap-1">
									<label className="text-sm font-medium text-gray-700">
										{t("admin:suppliersPage.name")}
									</label>
									<Input
										placeholder={t("admin:suppliersPage.namePlaceholder")}
										value={formData.name}
										onChange={(e) => handleFormChange("name", e.target.value)}
										required
									/>
								</div>
								<div className="flex flex-col gap-1">
									<label className="text-sm font-medium text-gray-700">
										{t("admin:suppliersPage.code")}
									</label>
									<Input
										placeholder={t("admin:suppliersPage.codePlaceholder")}
										value={formData.code}
										onChange={(e) => handleFormChange("code", e.target.value)}
										required
									/>
								</div>
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="ghost" onPress={handleCloseEditModal}>
								{t("common:cancel")}
							</Button>
							<Button
								variant="primary"
								onPress={handleUpdate}
								isPending={appApi.loading["admin.updateSupplier"]}
							>
								{t("common:save")}
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</div>
	);
}
