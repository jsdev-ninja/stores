import { useEffect, useState, useCallback } from "react";
import { Button } from "src/components/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { Input } from "@heroui/react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { TOrganizationGroup, TNewOrganizationGroup } from "@jsdev_ninja/core";

export function AdminOrganizationGroupsPage() {
	const { t } = useTranslation(["common", "admin"]);
	const [organizationGroups, setOrganizationGroups] = useState<TOrganizationGroup[]>([]);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [formData, setFormData] = useState<TNewOrganizationGroup>({
		name: "",
	});

	const appApi = useAppApi();

	const loadOrganizationGroups = useCallback(async () => {
		try {
			const result = await appApi.admin.listOrganizationGroups();
			if (result?.success) {
				setOrganizationGroups((result.data || []) as TOrganizationGroup[]);
			}
		} catch (error) {
			console.error("Failed to load organization groups:", error);
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// Load organization groups on component mount
	useEffect(() => {
		loadOrganizationGroups();
	}, [loadOrganizationGroups]);

	const handleCreate = async () => {
		try {
			const result = await appApi.admin.createOrganizationGroup(formData);
			if (result?.success) {
				await loadOrganizationGroups();
				setIsCreateModalOpen(false);
				resetForm();
			}
		} catch (error) {
			console.error("Failed to create organization group:", error);
		}
	};

	const handleDelete = async (organizationGroupId: string) => {
		if (window.confirm(t("admin:organizationGroupsPage.confirmDelete"))) {
			try {
				const result = await appApi.admin.deleteOrganizationGroup(organizationGroupId);
				if (result?.success) {
					await loadOrganizationGroups();
				}
			} catch (error) {
				console.error("Failed to delete organization group:", error);
			}
		}
	};

	const handleFormChange = (field: keyof TNewOrganizationGroup, value: string) => {
		setFormData((prev: TNewOrganizationGroup) => ({
			...prev,
			[field]: value,
		}));
	};

	const resetForm = () => {
		setFormData({
			name: "",
		});
	};

	return (
		<div className="w-full p-6">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">{t("admin:organizationGroupsPage.title")}</h1>
				<Button
					color="primary"
					onPress={() => setIsCreateModalOpen(true)}
					startContent={<Icon icon="lucide:plus" />}
				>
					{t("admin:organizationGroupsPage.createOrganizationGroup")}
				</Button>
			</div>

			<Table aria-label="Organization groups table">
				<TableHeader>
					<TableColumn>{t("admin:organizationGroupsPage.name")}</TableColumn>
					<TableColumn>{t("admin:organizationGroupsPage.actionsLabel")}</TableColumn>
				</TableHeader>
				<TableBody>
					{organizationGroups.map((organizationGroup) => (
						<TableRow key={organizationGroup.id}>
							<TableCell>{organizationGroup.name}</TableCell>
							<TableCell>
								<div className="flex gap-2">
									<Button
										size="sm"
										color="danger"
										variant="light"
										onPress={() => handleDelete(organizationGroup.id)}
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
								{t("admin:organizationGroupsPage.createOrganizationGroup")}
							</ModalHeader>
							<ModalBody>
								<Input
									label={t("admin:organizationGroupsPage.name")}
									placeholder={t("admin:organizationGroupsPage.namePlaceholder")}
									value={formData.name}
									onValueChange={(value) => handleFormChange("name", value)}
									isRequired
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
