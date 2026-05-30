import { useEffect, useState, useCallback } from "react";
import { Button } from "src/components/button";
import { Modal, Input, Table } from "@heroui/react";
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
		paymentType: "j5",
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

	const handleFormChange = (
		field: keyof Omit<TOrganization, "id">,
		value: string | number | undefined
	) => {
		setFormData((prev: TNewOrganization) => ({
			...prev,
			[field]: value,
		}));
	};

	const resetForm = () => {
		setFormData({
			name: "",
			paymentType: "j5",
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
					variant="primary"
					onPress={() => setIsCreateModalOpen(true)}
				>
					<Icon icon="lucide:plus" />
					{t("admin:organizationsPage.createOrganization")}
				</Button>
			</div>

			<Table aria-label="Organizations table">
				<Table.ScrollContainer>
					<Table.Content>
						<Table.Header>
							<Table.Column isRowHeader>{t("admin:organizationsPage.name")}</Table.Column>
							<Table.Column>חשבונות חיוב</Table.Column>
							<Table.Column>{t("admin:organizationsPage.discountPercentage")}</Table.Column>
							<Table.Column>{t("admin:organizationsPage.nameOnInvoice")}</Table.Column>
							<Table.Column>{t("admin:organizationsPage.actionsLabel")}</Table.Column>
						</Table.Header>
						<Table.Body items={organizations}>
							{(organization) => (
								<Table.Row id={organization.id}>
									<Table.Cell>{organization.name}</Table.Cell>
									<Table.Cell>
										{organization.billingAccounts?.length > 0
											? organization.billingAccounts.map((ba) => ba.number).join(", ")
											: "-"}
									</Table.Cell>
									<Table.Cell>
										{organization.discountPercentage
											? `${organization.discountPercentage}%`
											: "-"}
									</Table.Cell>
									<Table.Cell>{organization.nameOnInvoice || "-"}</Table.Cell>
									<Table.Cell>
										<div className="flex gap-2">
											<Button
												variant="ghost"
												onPress={() => handleViewDetails(organization.id)}
											>
												<Icon icon="lucide:eye" />
												{t("admin:organizationsPage.actions.view")}
											</Button>
											<Button
												variant="danger"
												onPress={() => handleDelete(organization.id)}
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
			<Modal isOpen={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
				<Modal.Backdrop />
				<Modal.Container>
					<Modal.Dialog>
						<Modal.Header>
							<Modal.Heading>{t("admin:organizationsPage.createOrganization")}</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<div className="flex flex-col gap-4">
								<div className="flex flex-col gap-1">
									<label className="text-sm font-medium text-gray-700">
										{t("admin:organizationsPage.name")}
									</label>
									<Input
										placeholder={t("admin:organizationsPage.namePlaceholder")}
										value={formData.name}
										onChange={(e) => handleFormChange("name", e.target.value)}
										required
									/>
								</div>
								<div className="flex flex-col gap-1">
									<label className="text-sm font-medium text-gray-700">
										{t("admin:organizationsPage.discountPercentage")}
									</label>
									<Input
										placeholder={t("admin:organizationsPage.discountPercentagePlaceholder")}
										type="number"
										value={formData.discountPercentage?.toString() || ""}
										onChange={(e) =>
											handleFormChange(
												"discountPercentage",
												e.target.value ? Number(e.target.value) : undefined
											)
										}
									/>
								</div>
								<div className="flex flex-col gap-1">
									<label className="text-sm font-medium text-gray-700">
										{t("admin:organizationsPage.nameOnInvoice")}
									</label>
									<Input
										placeholder={t("admin:organizationsPage.nameOnInvoicePlaceholder")}
										value={formData.nameOnInvoice || ""}
										onChange={(e) => handleFormChange("nameOnInvoice", e.target.value)}
									/>
								</div>
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="ghost" onPress={() => setIsCreateModalOpen(false)}>
								{t("common:cancel")}
							</Button>
							<Button variant="primary" onPress={handleCreate}>
								{t("common:create")}
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal>
		</div>
	);
}
