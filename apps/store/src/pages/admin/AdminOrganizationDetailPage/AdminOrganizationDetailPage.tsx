import { useEffect, useState } from "react";
import { Button } from "src/components/button";
import {
	Card,
	CardBody,
	CardHeader,
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
} from "@heroui/react";
import { Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { useParams, navigate } from "src/navigation";
import { TOrganization } from "@jsdev_ninja/core";

export function AdminOrganizationDetailPage() {
	const { t } = useTranslation(["common", "admin"]);
	const { id } = useParams("admin.organization");
	const [organization, setOrganization] = useState<TOrganization | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isAddBillingModalOpen, setIsAddBillingModalOpen] = useState(false);
	const [isEditBillingModalOpen, setIsEditBillingModalOpen] = useState(false);
	const [editingBillingAccount, setEditingBillingAccount] = useState<{
		number: string;
		name: string;
		id: string;
	} | null>(null);
	const [billingFormData, setBillingFormData] = useState<{
		number: string;
		name: string;
		id: string;
	}>({
		number: "",
		name: "",
		id: "",
	});

	const appApi = useAppApi();

	useEffect(() => {
		if (id) {
			loadOrganization(id);
		}
	}, [id]);

	const loadOrganization = async (organizationId: string) => {
		setLoading(true);
		setError(null);
		try {
			// For now, we'll get the organization from the list since getOrganization API doesn't exist yet
			const result = await appApi.admin.listOrganizations();
			if (result?.success && result.data) {
				const org = result.data.find((o) => o.id === organizationId);
				if (org) {
					setOrganization(org as TOrganization);
				} else {
					setError(t("admin:organizationsPage.organizationNotFound"));
				}
			} else {
				setError(t("admin:organizationsPage.failedToLoad"));
			}
		} catch (error) {
			console.error("Failed to load organization:", error);
			setError(t("admin:organizationsPage.failedToLoad"));
		} finally {
			setLoading(false);
		}
	};

	const handleAddBillingAccount = async () => {
		if (!organization) return;

		try {
			const newAccount = {
				...billingFormData,
				id: crypto.randomUUID(),
			};
			const updatedOrg = {
				...organization,
				billingAccounts: [...(organization.billingAccounts || []), newAccount],
			};

			const result = await appApi.admin.updateOrganization(updatedOrg);
			if (result?.success) {
				setOrganization(updatedOrg);
				setIsAddBillingModalOpen(false);
				resetBillingForm();
			}
		} catch (error) {
			console.error("Failed to add billing account:", error);
		}
	};

	const handleEditBillingAccount = async () => {
		if (!organization || !editingBillingAccount) return;

		try {
			const updatedOrg = {
				...organization,
				billingAccounts:
					organization.billingAccounts?.map((account: any) =>
						account.id === editingBillingAccount.id ? billingFormData : account
					) || [],
			};

			const result = await appApi.admin.updateOrganization(updatedOrg);
			if (result?.success) {
				setOrganization(updatedOrg);
				setIsEditBillingModalOpen(false);
				setEditingBillingAccount(null);
				resetBillingForm();
			}
		} catch (error) {
			console.error("Failed to edit billing account:", error);
		}
	};

	const handleRemoveBillingAccount = async (accountId: string) => {
		if (!organization) return;

		if (window.confirm(t("admin:organizationsPage.confirmDeleteBillingAccount"))) {
			try {
				const updatedOrg = {
					...organization,
					billingAccounts:
						organization.billingAccounts?.filter(
							(account: any) => account.id !== accountId
						) || [],
				};

				const result = await appApi.admin.updateOrganization(updatedOrg);
				if (result?.success) {
					setOrganization(updatedOrg);
				}
			} catch (error) {
				console.error("Failed to remove billing account:", error);
			}
		}
	};

	const openEditBillingModal = (account: { number: string; name: string; id: string }) => {
		setEditingBillingAccount(account);
		setBillingFormData({
			number: account.number,
			name: account.name,
			id: account.id,
		});
		setIsEditBillingModalOpen(true);
	};

	const resetBillingForm = () => {
		setBillingFormData({
			number: "",
			name: "",
			id: "",
		});
	};

	const handleBillingFormChange = (field: string, value: string) => {
		setBillingFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleBack = () => {
		navigate({ to: "admin.organizations" });
	};

	if (loading) {
		return (
			<div className="w-full p-6">
				<div className="flex items-center justify-center h-64">
					<div className="text-lg text-start">{t("common:loading")}</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full p-6">
				<div className="flex items-center justify-center h-64">
					<div className="text-center">
						<div className="text-lg text-red-500 mb-4 text-start">{error}</div>
						<Button onPress={handleBack} startContent={<Icon icon="lucide:arrow-right" />}>
							{t("common:back")}
						</Button>
					</div>
				</div>
			</div>
		);
	}

	if (!organization) {
		return (
			<div className="w-full p-6">
				<div className="flex items-center justify-center h-64">
					<div className="text-center">
						<div className="text-lg mb-4 text-start">
							{t("admin:organizationsPage.organizationNotFound")}
						</div>
						<Button onPress={handleBack} startContent={<Icon icon="lucide:arrow-right" />}>
							{t("common:back")}
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full p-6">
			<div className="flex items-center gap-4 mb-6">
				<Button
					variant="light"
					onPress={handleBack}
					startContent={<Icon icon="lucide:arrow-right" />}
				>
					{t("common:back")}
				</Button>
				<h1 className="text-2xl font-bold text-start">{organization.name}</h1>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<h2 className="text-lg font-semibold text-start">
							{t("admin:organizationsPage.basicInfo")}
						</h2>
					</CardHeader>
					<CardBody className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1 text-start">
								{t("admin:organizationsPage.name")}
							</label>
							<div className="text-lg text-start">{organization.name}</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1 text-start">
								{t("admin:organizationsPage.discountPercentage")}
							</label>
							<div className="text-lg text-start">
								{organization.discountPercentage
									? `${organization.discountPercentage}%`
									: t("admin:organizationsPage.noDiscount")}
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1 text-start">
								{t("admin:organizationsPage.nameOnInvoice")}
							</label>
							<div className="text-lg text-start">
								{organization.nameOnInvoice || t("admin:organizationsPage.notSet")}
							</div>
						</div>
					</CardBody>
				</Card>

				<Card>
					<CardHeader>
						<h2 className="text-lg font-semibold text-start">
							{t("admin:organizationsPage.organizationId")}
						</h2>
					</CardHeader>
					<CardBody>
						<div className="text-sm font-mono bg-gray-100 p-3 rounded text-start">
							{organization.id}
						</div>
					</CardBody>
				</Card>
			</div>

			{/* Billing Accounts Section */}
			<div className="mt-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<h2 className="text-lg font-semibold text-start">
							{t("admin:organizationsPage.billingAccounts")}
						</h2>
						<Button
							color="primary"
							size="sm"
							onPress={() => setIsAddBillingModalOpen(true)}
							startContent={<Icon icon="lucide:plus" />}
						>
							{t("admin:organizationsPage.addBillingAccount")}
						</Button>
					</CardHeader>
					<CardBody>
						{organization.billingAccounts && organization.billingAccounts.length > 0 ? (
							<div className="space-y-4">
								{organization.billingAccounts.map((account: any, index: number) => (
									<div
										key={index}
										className="flex items-center justify-between p-4 border rounded-lg"
									>
										<div className="flex-1">
											<div className="font-medium text-start">{account.name}</div>
											<div className="text-sm font-mono text-gray-500 text-start">
												{account.number}
											</div>
										</div>
										<div className="flex gap-2">
											<Button
												size="sm"
												variant="light"
												onPress={() => openEditBillingModal(account)}
												startContent={<Icon icon="lucide:edit" />}
											>
												{t("common:edit")}
											</Button>
											<Button
												size="sm"
												color="danger"
												variant="light"
												onPress={() => handleRemoveBillingAccount(account.id)}
												startContent={<Icon icon="lucide:trash" />}
											>
												{t("common:delete")}
											</Button>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8 text-gray-500">
								<div className="text-start">
									{t("admin:organizationsPage.noBillingAccounts")}
								</div>
							</div>
						)}
					</CardBody>
				</Card>
			</div>

			{/* Add Billing Account Modal */}
			<Modal isOpen={isAddBillingModalOpen} onOpenChange={setIsAddBillingModalOpen} size="md">
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								<div className="text-start">
									{t("admin:organizationsPage.addBillingAccount")}
								</div>
							</ModalHeader>
							<ModalBody>
								<Input
									label={t("admin:organizationsPage.accountName")}
									placeholder={t("admin:organizationsPage.accountNamePlaceholder")}
									value={billingFormData.name}
									onValueChange={(value) => handleBillingFormChange("name", value)}
									isRequired
									classNames={{
										input: "text-start",
										label: "text-start",
									}}
								/>
								<Input
									label={t("admin:organizationsPage.accountNumber")}
									placeholder={t("admin:organizationsPage.accountNumberPlaceholder")}
									value={billingFormData.number}
									onValueChange={(value) => handleBillingFormChange("number", value)}
									isRequired
									classNames={{
										input: "text-start",
										label: "text-start",
									}}
								/>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									{t("common:cancel")}
								</Button>
								<Button color="primary" onPress={handleAddBillingAccount}>
									{t("common:create")}
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>

			{/* Edit Billing Account Modal */}
			<Modal isOpen={isEditBillingModalOpen} onOpenChange={setIsEditBillingModalOpen} size="md">
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								<div className="text-start">
									{t("admin:organizationsPage.editBillingAccount")}
								</div>
							</ModalHeader>
							<ModalBody>
								<Input
									label={t("admin:organizationsPage.accountName")}
									placeholder={t("admin:organizationsPage.accountNamePlaceholder")}
									value={billingFormData.name}
									onValueChange={(value) => handleBillingFormChange("name", value)}
									isRequired
									classNames={{
										input: "text-start",
										label: "text-start",
									}}
								/>
								<Input
									label={t("admin:organizationsPage.accountNumber")}
									placeholder={t("admin:organizationsPage.accountNumberPlaceholder")}
									value={billingFormData.number}
									onValueChange={(value) => handleBillingFormChange("number", value)}
									isRequired
									classNames={{
										input: "text-start",
										label: "text-start",
									}}
								/>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									{t("common:cancel")}
								</Button>
								<Button color="primary" onPress={handleEditBillingAccount}>
									{t("common:update")}
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</div>
	);
}
