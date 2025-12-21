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
	Select,
	SelectItem,
} from "@heroui/react";
import { Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { useParams, navigate } from "src/navigation";
import { TOrganization, TPaymentType, TProfile, TOrganizationGroup } from "@jsdev_ninja/core";

type ClientFormState = {
	displayName: string;
	email: string;
	phoneNumber: string;
	clientType: TProfile["clientType"];
	paymentType: TProfile["paymentType"];
	companyName: string;
};

type ClientFormErrors = {
	displayName?: string;
	email?: string;
};

const createEmptyClientForm = (): ClientFormState => ({
	displayName: "",
	email: "",
	phoneNumber: "",
	clientType: "user",
	paymentType: "j5",
	companyName: "",
});

export function AdminOrganizationDetailPage() {
	const { t } = useTranslation(["common", "admin"]);
	const { id } = useParams("admin.organization");
	const [organization, setOrganization] = useState<TOrganization | null>(null);
	console.log("organization", organization);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [organizationClients, setOrganizationClients] = useState<TProfile[]>([]);
	const [clientsLoading, setClientsLoading] = useState(true);
	const [clientsError, setClientsError] = useState<string | null>(null);
	const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
	const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
	const [editingClient, setEditingClient] = useState<TProfile | null>(null);
	const [clientFormData, setClientFormData] = useState<ClientFormState>(createEmptyClientForm);
	const [clientFormErrors, setClientFormErrors] = useState<ClientFormErrors>({});
	const [clientSearchEmail, setClientSearchEmail] = useState("");
	const [clientSearchResult, setClientSearchResult] = useState<TProfile | null>(null);
	const [clientSearchExistingOrg, setClientSearchExistingOrg] = useState<TOrganization | null>(
		null
	);
	const [clientSearchError, setClientSearchError] = useState<string | null>(null);
	const [isSearchingClient, setIsSearchingClient] = useState(false);
	const [isSubmittingClient, setIsSubmittingClient] = useState(false);
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
	const [isEditOrganizationModalOpen, setIsEditOrganizationModalOpen] = useState(false);
	const [organizationFormData, setOrganizationFormData] = useState<{
		name: string;
		discountPercentage: number | undefined;
		nameOnInvoice: string;
		paymentType: TPaymentType;
		companyNumber: string;
		groupId: string | undefined;
	}>({
		name: "",
		discountPercentage: undefined,
		nameOnInvoice: "",
		paymentType: "j5",
		companyNumber: "",
		groupId: undefined,
	});
	const [isSubmittingOrganization, setIsSubmittingOrganization] = useState(false);
	const [organizationGroups, setOrganizationGroups] = useState<TOrganizationGroup[]>([]);
	const [organizationGroupsLoading, setOrganizationGroupsLoading] = useState(false);

	const appApi = useAppApi();

	useEffect(() => {
		if (id) {
			loadOrganization(id);
		}
		loadOrganizationGroups();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const loadOrganizationGroups = async () => {
		setOrganizationGroupsLoading(true);
		try {
			const result = await appApi.admin.listOrganizationGroups();
			if (result?.success) {
				setOrganizationGroups((result.data || []) as TOrganizationGroup[]);
			}
		} catch (error) {
			console.error("Failed to load organization groups:", error);
		} finally {
			setOrganizationGroupsLoading(false);
		}
	};

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
					await loadOrganizationClients(org.id);
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

	const loadOrganizationClients = async (organizationId: string) => {
		setClientsLoading(true);
		setClientsError(null);
		try {
			const result = await appApi.admin.listOrganizationClients(organizationId);
			if (result?.success) {
				setOrganizationClients((result.data || []) as TProfile[]);
			} else {
				setClientsError(t("admin:organizationsPage.failedToLoadUsers"));
				setOrganizationClients([]);
			}
		} catch (error) {
			console.error("Failed to load organization clients:", error);
			setClientsError(t("admin:organizationsPage.failedToLoadUsers"));
			setOrganizationClients([]);
		} finally {
			setClientsLoading(false);
		}
	};

	const resetClientSearch = () => {
		setClientSearchEmail("");
		setClientSearchResult(null);
		setClientSearchExistingOrg(null);
		setClientSearchError(null);
		setIsSearchingClient(false);
	};

	const resetClientForm = () => {
		setClientFormData(createEmptyClientForm());
		setClientFormErrors({});
	};

	const handleClientFormChange = <K extends keyof ClientFormState>(
		field: K,
		value: ClientFormState[K]
	) => {
		setClientFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const validateClientForm = () => {
		const errors: ClientFormErrors = {};

		if (!clientFormData.displayName.trim()) {
			errors.displayName = t("admin:organizationsPage.errors.displayNameRequired");
		}

		if (!clientFormData.email.trim()) {
			errors.email = t("admin:organizationsPage.errors.emailRequired");
		}

		setClientFormErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleOpenAddClientModal = () => {
		resetClientSearch();
		setIsAddClientModalOpen(true);
	};

	const handleSearchClient = async () => {
		setClientSearchError(null);
		setClientSearchResult(null);
		setClientSearchExistingOrg(null);

		const email = clientSearchEmail.trim();
		if (!email) {
			setClientSearchError(t("admin:organizationsPage.errors.emailRequired"));
			return;
		}

		try {
			setIsSearchingClient(true);
			const result = await appApi.admin.findClientByEmail(email);
			if (result?.success && result.data) {
				const profile = result.data as TProfile;
				setClientSearchResult(profile);

				if (profile.organizationId) {
					if (profile.organizationId === organization?.id) {
						setClientSearchExistingOrg(organization);
					} else {
						const orgList = await appApi.admin.listOrganizations();
						if (orgList?.success && orgList.data) {
							const matchedOrg = orgList.data.find(
								(org) => org.id === profile.organizationId
							);
							if (matchedOrg) {
								setClientSearchExistingOrg(matchedOrg as TOrganization);
							}
						}
					}
				}
			} else {
				setClientSearchError(t("admin:organizationsPage.clientNotFound"));
			}
		} catch (error) {
			console.error("Failed to search client by email:", error);
			setClientSearchError(t("admin:organizationsPage.failedToLoadUsers"));
		} finally {
			setIsSearchingClient(false);
		}
	};

	const handleAddClient = async () => {
		if (!organization || !clientSearchResult || clientSearchExistingOrg) return;

		try {
			setIsSubmittingClient(true);
			const result = await appApi.admin.assignClientToOrganization({
				clientId: clientSearchResult.id,
				organizationId: organization.id,
			});

			if (result?.success) {
				setIsAddClientModalOpen(false);
				resetClientSearch();
				await loadOrganizationClients(organization.id);
			}
		} catch (error) {
			console.error("Failed to assign client to organization:", error);
			setClientSearchError(t("admin:organizationsPage.failedToAssignClient"));
		} finally {
			setIsSubmittingClient(false);
		}
	};

	const openEditClientModal = (client: TProfile) => {
		setEditingClient(client);
		setClientFormErrors({});
		setClientFormData({
			displayName: client.displayName || "",
			email: client.email || "",
			phoneNumber: client.phoneNumber || "",
			clientType: client.clientType,
			paymentType: client.paymentType,
			companyName: client.companyName || "",
		});
		setIsEditClientModalOpen(true);
	};

	const handleEditClient = async () => {
		if (!organization || !editingClient) return;
		if (!validateClientForm()) return;

		try {
			setIsSubmittingClient(true);

			const updatedClient: TProfile = {
				...editingClient,
				displayName: clientFormData.displayName.trim(),
				email: clientFormData.email.trim(),
				phoneNumber: clientFormData.phoneNumber ? clientFormData.phoneNumber.trim() : undefined,
				clientType: clientFormData.clientType,
				paymentType: clientFormData.paymentType,
				companyName: clientFormData.companyName ? clientFormData.companyName.trim() : undefined,
				lastActivityDate: Date.now(),
				organizationId: organization.id,
			};

			const result = await appApi.admin.updateClient(updatedClient);
			if (result?.success) {
				setIsEditClientModalOpen(false);
				setEditingClient(null);
				resetClientForm();
				await loadOrganizationClients(organization.id);
			}
		} catch (error) {
			console.error("Failed to update organization client:", error);
		} finally {
			setIsSubmittingClient(false);
		}
	};

	const handleRemoveClient = async (client: TProfile) => {
		if (!organization) return;

		if (
			!window.confirm(
				t("admin:organizationsPage.confirmRemoveOrganizationUser", {
					name: client.displayName,
				})
			)
		) {
			return;
		}

		try {
			const result = await appApi.admin.removeClientFromOrganization(client.id);
			if (result?.success) {
				await loadOrganizationClients(organization.id);
			}
		} catch (error) {
			console.error("Failed to remove client from organization:", error);
		}
	};

	const renderClientDetailsForm = () => (
		<>
			<Input
				label={t("common:name")}
				placeholder={t("admin:organizationsPage.clientNamePlaceholder")}
				value={clientFormData.displayName}
				onChange={(event) => handleClientFormChange("displayName", event.target.value)}
				isRequired
				isInvalid={!!clientFormErrors.displayName}
				errorMessage={clientFormErrors.displayName}
				classNames={{
					input: "text-start",
					label: "text-start",
				}}
			/>
			<Input
				label={t("common:email")}
				type="email"
				placeholder={t("admin:organizationsPage.clientEmailPlaceholder")}
				value={clientFormData.email}
				onChange={(event) => handleClientFormChange("email", event.target.value)}
				isRequired
				isInvalid={!!clientFormErrors.email}
				errorMessage={clientFormErrors.email}
				classNames={{
					input: "text-start",
					label: "text-start",
				}}
			/>
			<Input
				label={t("common:phone")}
				placeholder={t("admin:organizationsPage.clientPhonePlaceholder")}
				value={clientFormData.phoneNumber}
				onChange={(event) => handleClientFormChange("phoneNumber", event.target.value)}
				classNames={{
					input: "text-start",
					label: "text-start",
				}}
			/>
			<Select
				label={t("common:clientType")}
				selectedKeys={[clientFormData.clientType]}
				onChange={(event) =>
					handleClientFormChange(
						"clientType",
						event.target.value as ClientFormState["clientType"]
					)
				}
				isRequired
				classNames={{
					label: "text-start",
				}}
			>
				<SelectItem key="user">{t("common:clientTypes.user")}</SelectItem>
				<SelectItem key="company">{t("common:clientTypes.company")}</SelectItem>
			</Select>
			{clientFormData.clientType === "company" && (
				<Input
					label={t("common:companyName")}
					placeholder={t("admin:organizationsPage.clientCompanyNamePlaceholder")}
					value={clientFormData.companyName}
					onChange={(event) => handleClientFormChange("companyName", event.target.value)}
					classNames={{
						input: "text-start",
						label: "text-start",
					}}
				/>
			)}
			<Select
				label={t("common:paymentType")}
				selectedKeys={[clientFormData.paymentType]}
				onChange={(event) =>
					handleClientFormChange(
						"paymentType",
						event.target.value as ClientFormState["paymentType"]
					)
				}
				isRequired
				classNames={{
					label: "text-start",
				}}
			>
				<SelectItem key="j5">{t("common:paymentTypes.j5")}</SelectItem>
				<SelectItem key="external">{t("common:paymentTypes.external")}</SelectItem>
				<SelectItem key="none">{t("common:paymentTypes.none")}</SelectItem>
			</Select>
		</>
	);

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

	const openEditOrganizationModal = () => {
		if (!organization) return;
		const org = organization as TOrganization;
		setOrganizationFormData({
			name: org.name,
			discountPercentage: org.discountPercentage,
			nameOnInvoice: org.nameOnInvoice || "",
			paymentType: (org as any).paymentType || "default",
			companyNumber: org.companyNumber || "",
			groupId: org.groupId || undefined,
		});
		setIsEditOrganizationModalOpen(true);
	};

	const handleOrganizationFormChange = (
		field: keyof typeof organizationFormData,
		value: string | number | undefined
	) => {
		setOrganizationFormData((prev) => {
			if (field === "groupId") {
				return {
					...prev,
					[field]: value === "" || value === "none" ? undefined : (value as string | undefined),
				};
			}
			return {
				...prev,
				[field]: value === "" ? undefined : value || "",
			};
		});
	};

	console.log("organizationFormData", organizationFormData);

	const handleUpdateOrganization = async () => {
		if (!organization) return;

		try {
			setIsSubmittingOrganization(true);
			const updatedOrg: TOrganization = {
				...organization,
				name: organizationFormData.name.trim(),
				discountPercentage: organizationFormData.discountPercentage,
				nameOnInvoice: organizationFormData.nameOnInvoice.trim(),
				paymentType: organizationFormData.paymentType,
				companyNumber: organizationFormData.companyNumber.trim() || undefined,
				groupId: organizationFormData.groupId || undefined,
			} as TOrganization;

			const result = await appApi.admin.updateOrganization(updatedOrg);
			if (result?.success) {
				setOrganization(updatedOrg);
				setIsEditOrganizationModalOpen(false);
			}
		} catch (error) {
			console.error("Failed to update organization:", error);
		} finally {
			setIsSubmittingOrganization(false);
		}
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
					<CardHeader className="flex flex-row items-center justify-between">
						<h2 className="text-lg font-semibold text-start">
							{t("admin:organizationsPage.basicInfo")}
						</h2>
						<Button
							size="sm"
							variant="light"
							onPress={openEditOrganizationModal}
							startContent={<Icon icon="lucide:edit" />}
						>
							{t("common:edit")}
						</Button>
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
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1 text-start">
								{t("common:paymentType")}
							</label>
							<div className="text-lg text-start">
								{t(
									`common:paymentTypes.${
										(organization as any).paymentType || "default"
									}` as any
								)}
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1 text-start">
								{t("admin:organizationsPage.companyNumber")}
							</label>
							<div className="text-lg text-start">
								{organization.companyNumber || t("admin:organizationsPage.notSet")}
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1 text-start">
								{t("admin:organizationsPage.group")}
							</label>
							<div className="text-lg text-start">
								{organization.groupId
									? organizationGroups.find((g) => g.id === organization.groupId)?.name ||
									  t("admin:organizationsPage.notSet")
									: t("admin:organizationsPage.notSet")}
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

			{/* Organization Clients Section */}
			<div className="mt-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<h2 className="text-lg font-semibold text-start">
							{t("admin:organizationsPage.organizationUsers")}
						</h2>
						<Button
							color="primary"
							size="sm"
							onPress={handleOpenAddClientModal}
							startContent={<Icon icon="lucide:plus" />}
						>
							{t("admin:organizationsPage.addOrganizationUser")}
						</Button>
					</CardHeader>
					<CardBody>
						{clientsLoading ? (
							<div className="text-center py-8 text-gray-500">
								<div className="text-start">{t("common:loading")}</div>
							</div>
						) : clientsError ? (
							<div className="text-sm text-red-500 text-start">{clientsError}</div>
						) : organizationClients.length > 0 ? (
							<div className="space-y-4">
								{organizationClients.map((client) => (
									<div
										key={client.id}
										className="flex items-center justify-between p-4 border rounded-lg"
									>
										<div className="flex-1">
											<div className="font-medium text-start">{client.displayName}</div>
											<div className="text-sm text-gray-500 text-start">
												{client.email}
											</div>
											<div className="text-xs text-gray-400 text-start mt-1">
												{t("common:clientType")}:{" "}
												{t(`common:clientTypes.${client.clientType}`)} •{" "}
												{t("common:paymentType")}:{" "}
												{t(`common:paymentTypes.${client.paymentType}`)}
											</div>
										</div>
										<div className="flex gap-2">
											<Button
												size="sm"
												variant="light"
												onPress={() => openEditClientModal(client)}
												startContent={<Icon icon="lucide:edit" />}
											>
												{t("common:edit")}
											</Button>
											<Button
												size="sm"
												color="danger"
												variant="light"
												onPress={() => handleRemoveClient(client)}
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
									{t("admin:organizationsPage.noOrganizationUsers")}
								</div>
							</div>
						)}
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

			{/* Add Organization Client Modal */}
			<Modal
				isOpen={isAddClientModalOpen}
				onOpenChange={(open) => {
					setIsAddClientModalOpen(open);
					if (!open) {
						resetClientSearch();
						setIsSubmittingClient(false);
					}
				}}
				size="md"
			>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								<div className="text-start">
									{t("admin:organizationsPage.addOrganizationUser")}
								</div>
							</ModalHeader>
							<ModalBody>
								<div className="space-y-4">
									<Input
										label={t("admin:organizationsPage.enterClientEmail")}
										placeholder={t("admin:organizationsPage.clientEmailPlaceholder")}
										value={clientSearchEmail}
										onChange={(event) => setClientSearchEmail(event.target.value)}
										classNames={{
											input: "text-start",
											label: "text-start",
										}}
									/>
									<Button
										color="primary"
										onPress={handleSearchClient}
										isLoading={isSearchingClient}
										isDisabled={isSubmittingClient}
										startContent={<Icon icon="lucide:search" />}
									>
										{t("admin:organizationsPage.searchClient")}
									</Button>
									{clientSearchError && (
										<div className="text-start text-red-500 text-sm">
											{clientSearchError}
										</div>
									)}
									{clientSearchResult && (
										<div className="border rounded-lg p-4 space-y-1 text-start bg-gray-50">
											<div className="text-sm font-medium">
												{clientSearchResult.displayName}
											</div>
											<div className="text-sm text-gray-600">
												{clientSearchResult.email}
											</div>
											<div className="text-xs text-gray-500">
												{t("common:clientType")}:{" "}
												{t(`common:clientTypes.${clientSearchResult.clientType}`)}
											</div>
											<div className="text-xs text-gray-500">
												{t("common:paymentType")}:{" "}
												{t(`common:paymentTypes.${clientSearchResult.paymentType}`)}
											</div>
											{clientSearchExistingOrg && (
												<div className="mt-3 rounded-md border border-warning-300 bg-warning-50 p-3 text-xs text-warning-600">
													<div className="font-medium">
														{clientSearchExistingOrg.id === organization.id
															? t(
																	"admin:organizationsPage.alreadyInThisOrganization"
															  )
															: t("admin:organizationsPage.alreadyInOrganization", {
																	name: clientSearchExistingOrg.name,
															  })}
													</div>
													{clientSearchExistingOrg.id !== organization.id && (
														<div className="mt-1 text-warning-500">
															{t(
																"admin:organizationsPage.alreadyInOrganizationDescription",
																{
																	name: clientSearchExistingOrg.name,
																}
															)}
														</div>
													)}
												</div>
											)}
										</div>
									)}
								</div>
							</ModalBody>
							<ModalFooter>
								<Button
									color="danger"
									variant="light"
									onPress={() => {
										resetClientSearch();
										setIsAddClientModalOpen(false);
										onClose();
									}}
								>
									{t("common:cancel")}
								</Button>
								<Button
									color="primary"
									onPress={handleAddClient}
									isLoading={isSubmittingClient}
									isDisabled={
										!clientSearchResult || isSearchingClient || !!clientSearchExistingOrg
									}
								>
									{t("admin:organizationsPage.assignExistingClient")}
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>

			{/* Edit Organization Client Modal */}
			<Modal
				isOpen={isEditClientModalOpen}
				onOpenChange={(open) => {
					setIsEditClientModalOpen(open);
					if (!open) {
						setEditingClient(null);
						resetClientForm();
						setIsSubmittingClient(false);
					}
				}}
				size="md"
			>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								<div className="text-start">
									{t("admin:organizationsPage.editOrganizationUser")}
								</div>
							</ModalHeader>
							<ModalBody>
								<div className="space-y-3">{renderClientDetailsForm()}</div>
							</ModalBody>
							<ModalFooter>
								<Button
									color="danger"
									variant="light"
									onPress={() => {
										setIsEditClientModalOpen(false);
										setEditingClient(null);
										resetClientForm();
										onClose();
									}}
								>
									{t("common:cancel")}
								</Button>
								<Button
									color="primary"
									onPress={handleEditClient}
									isLoading={isSubmittingClient}
								>
									{t("common:update")}
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>

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

			{/* Edit Organization Modal */}
			<Modal
				isOpen={isEditOrganizationModalOpen}
				onOpenChange={setIsEditOrganizationModalOpen}
				size="md"
			>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								<div className="text-start">
									{t("admin:organizationsPage.editOrganization")}
								</div>
							</ModalHeader>
							<ModalBody>
								<Input
									label={t("admin:organizationsPage.name")}
									placeholder={t("admin:organizationsPage.namePlaceholder")}
									value={organizationFormData.name}
									onValueChange={(value) => handleOrganizationFormChange("name", value)}
									isRequired
									classNames={{
										input: "text-start",
										label: "text-start",
									}}
								/>
								<Input
									label={t("admin:organizationsPage.discountPercentage")}
									placeholder={t("admin:organizationsPage.discountPercentagePlaceholder")}
									type="number"
									value={organizationFormData.discountPercentage?.toString() || ""}
									onValueChange={(value) =>
										handleOrganizationFormChange(
											"discountPercentage",
											value ? Number(value) : undefined
										)
									}
									classNames={{
										input: "text-start",
										label: "text-start",
									}}
								/>
								<Input
									label={t("admin:organizationsPage.nameOnInvoice")}
									placeholder={t("admin:organizationsPage.nameOnInvoicePlaceholder")}
									value={organizationFormData.nameOnInvoice}
									onValueChange={(value) =>
										handleOrganizationFormChange("nameOnInvoice", value)
									}
									classNames={{
										input: "text-start",
										label: "text-start",
									}}
								/>
								<Input
									label={t("admin:organizationsPage.companyNumber")}
									placeholder={t("admin:organizationsPage.companyNumberPlaceholder")}
									value={organizationFormData.companyNumber}
									onValueChange={(value) =>
										handleOrganizationFormChange("companyNumber", value)
									}
									classNames={{
										input: "text-start",
										label: "text-start",
									}}
								/>
								<Select
									label={t("common:paymentType")}
									selectedKeys={[organizationFormData.paymentType]}
									onChange={(event) =>
										handleOrganizationFormChange(
											"paymentType",
											event.target.value as TPaymentType
										)
									}
									isRequired
									classNames={{
										label: "text-start",
									}}
								>
									<SelectItem key="j5">{t("common:paymentTypes.j5")}</SelectItem>
									<SelectItem key="external">
										{t("common:paymentTypes.external")}
									</SelectItem>
									<SelectItem key="none">{t("common:paymentTypes.none")}</SelectItem>
								</Select>
								<Select
									label={t("admin:organizationsPage.group")}
									placeholder={t("admin:organizationsPage.selectGroup")}
									selectedKeys={organizationFormData.groupId ? [organizationFormData.groupId] : []}
									onChange={(event) =>
										handleOrganizationFormChange(
											"groupId",
											event.target.value === "none" ? undefined : event.target.value
										)
									}
									isDisabled={organizationGroupsLoading}
									classNames={{
										label: "text-start",
									}}
									startContent={<Icon icon="lucide:folder-tree" className="text-default-400" />}
									items={[{ id: "none", name: t("admin:organizationsPage.noGroup") }, ...organizationGroups]}
								>
									{(group) => (
										<SelectItem textValue={group.name} key={group.id}>
											{group.name}
										</SelectItem>
									)}
								</Select>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									{t("common:cancel")}
								</Button>
								<Button
									color="primary"
									onPress={handleUpdateOrganization}
									isLoading={isSubmittingOrganization}
								>
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
