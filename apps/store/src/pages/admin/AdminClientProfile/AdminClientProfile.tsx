import React, { useEffect, useState } from "react";
import {
	Card,
	CardBody,
	Input,
	Button,
	Select,
	SelectItem,
	Avatar,
	Badge,
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Spinner,
	useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { TProfile } from "@jsdev_ninja/core";
import { useParams, navigate } from "src/navigation";
import { useAppApi } from "src/appApi";
import { useTranslation } from "react-i18next";

// Organization type (from appApi/index.ts)
type TOrganization = {
	id: string;
	name: string;
	discountPercentage?: number;
	nameOnInvoice?: string;
};

interface AddressFormProps {
	address?: TProfile["address"];
	onChange: (address: TProfile["address"]) => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ address, onChange }) => {
	const { t } = useTranslation(["common", "admin"]);
	const [formData, setFormData] = React.useState<TProfile["address"]>(
		address || {
			street: "",
			city: "",
			country: "",
			apartmentEnterNumber: "",
			apartmentNumber: "",
			floor: "",
			streetNumber: "",
		}
	);

	const handleChange = (field: any, value: string) => {
		const updatedAddress: any = {
			...formData,
			[field]: value,
		};

		setFormData(updatedAddress);
		onChange(updatedAddress);
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<Input
				label={t("common:street")}
				value={formData?.street || ""}
				onChange={(e) => handleChange("street", e.target.value)}
				className="md:col-span-2"
			/>

			<Input
				label={t("common:city")}
				value={formData?.city || ""}
				onChange={(e) => handleChange("city", e.target.value)}
			/>

			<Input
				label={t("common:streetNumber")}
				value={formData?.streetNumber || ""}
				onChange={(e) => handleChange("streetNumber", e.target.value)}
			/>

			<Input
				label={t("common:apartmentEnterNumber")}
				value={formData?.apartmentEnterNumber || ""}
				onChange={(e) => handleChange("apartmentEnterNumber", e.target.value)}
			/>

			<Input
				label={t("common:apartmentNumber")}
				value={formData?.apartmentNumber || ""}
				onChange={(e) => handleChange("apartmentNumber", e.target.value)}
			/>

			<Input
				label={t("common:floor")}
				value={formData?.floor || ""}
				onChange={(e) => handleChange("floor", e.target.value)}
			/>
		</div>
	);
};

const formatDate = (timestamp: number): string => {
	const date = new Date(timestamp);
	return new Intl.DateTimeFormat("he-IL", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
};

interface ClientProfileHeaderProps {
	profile: TProfile;
	onRemove: () => void;
}

const ClientProfileHeader: React.FC<ClientProfileHeaderProps> = ({ profile, onRemove }) => {
	const { t } = useTranslation(["common", "admin"]);
	const { isOpen, onOpen, onOpenChange } = useDisclosure();
	const [isDeleting, setIsDeleting] = React.useState(false);

	const handleRemove = async () => {
		setIsDeleting(true);
		try {
			await onRemove();
		} catch (error) {
			console.error("Failed to remove client:", error);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="bg-white rounded-lg shadow-md p-6">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<Avatar
						name={profile.displayName}
						size="lg"
						color={profile.clientType === "company" ? "primary" : "secondary"}
						className="h-16 w-16"
					/>
					<div>
						<h1 className="text-2xl font-bold">{profile.displayName}</h1>
						<div className="flex items-center gap-2 text-default-500">
							<Icon icon="lucide:mail" className="text-sm" />
							<span>{profile.email}</span>
						</div>
						{profile.phoneNumber && (
							<div className="flex items-center gap-2 text-default-500">
								<Icon icon="lucide:phone" className="text-sm" />
								<span>{profile.phoneNumber}</span>
							</div>
						)}
					</div>
				</div>

				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2 flex-wrap">
						<Badge color={profile.clientType === "company" ? "primary" : "secondary"}>
							{t(`common:clientTypes.${profile.clientType}`)}
						</Badge>
						{profile.isAnonymous && (
							<Badge color="warning">{t("admin:clientProfile.anonymous")}</Badge>
						)}
						{profile.organizationId && (
							<Badge color="success">
								<div className="flex items-center gap-1">
									<Icon icon="lucide:building-2" className="w-3 h-3" />
									{t("admin:clientProfile.organizationMember")}
								</div>
							</Badge>
						)}
					</div>
					<div className="text-sm text-default-500">
						<div>
							{t("admin:clientProfile.created")}: {formatDate(profile.createdDate)}
						</div>
						<div>
							{t("admin:clientProfile.lastActivity")}: {formatDate(profile.lastActivityDate)}
						</div>
					</div>
				</div>

				<Button
					color="danger"
					variant="light"
					startContent={<Icon icon="lucide:trash-2" />}
					onPress={onOpen}
				>
					{t("admin:clientProfile.removeClient")}
				</Button>
			</div>

			<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								{t("admin:clientProfile.confirmRemoval")}
							</ModalHeader>
							<ModalBody>
								<p>
									{t("admin:clientProfile.removeConfirmMessage")}{" "}
									<strong>{profile.displayName}</strong>?
									{t("admin:clientProfile.actionCannotBeUndone")}
								</p>
							</ModalBody>
							<ModalFooter>
								<Button variant="light" onPress={onClose}>
									{t("common:cancel")}
								</Button>
								<Button color="danger" onPress={handleRemove} isLoading={isDeleting}>
									{t("admin:clientProfile.removeClient")}
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</div>
	);
};

interface ClientProfileFormProps {
	profile: TProfile;
	onSubmit: (updatedProfile: TProfile) => void;
}

const ClientProfileForm: React.FC<ClientProfileFormProps> = ({ profile, onSubmit }) => {
	const { t } = useTranslation(["common", "admin"]);
	const [formData, setFormData] = React.useState<TProfile>(profile);
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [errors, setErrors] = React.useState<Record<string, string>>({});

	const handleChange = (field: keyof TProfile, value: any) => {
		setFormData((prev: any) => ({
			...prev,
			[field]: value,
		}));

		// Clear error when field is edited
		if (errors[field]) {
			setErrors((prev) => ({
				...prev,
				[field]: "",
			}));
		}
	};

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.displayName.trim()) {
			newErrors.displayName = t("admin:clientProfile.displayNameRequired");
		}

		if (!formData.email.trim()) {
			newErrors.email = t("admin:clientProfile.emailRequired");
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = t("admin:clientProfile.invalidEmailFormat");
		}

		if (formData.phoneNumber && formData.phoneNumber.trim() === "") {
			newErrors.phoneNumber = t("admin:clientProfile.phoneCannotBeEmpty");
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setIsSubmitting(true);
		try {
			await onSubmit(formData);
		} catch (error) {
			console.error("Failed to update profile:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<Card className="mb-6">
				<CardBody>
					<h2 className="text-xl font-semibold mb-4">
						{t("admin:clientProfile.basicInformation")}
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Input
							label={t("common:name")}
							value={formData.displayName}
							onChange={(e) => handleChange("displayName", e.target.value)}
							isRequired
							isInvalid={!!errors.displayName}
							errorMessage={errors.displayName}
						/>

						<Input
							label={t("common:email")}
							type="email"
							value={formData.email}
							onChange={(e) => handleChange("email", e.target.value)}
							isRequired
							isInvalid={!!errors.email}
							errorMessage={errors.email}
						/>

						<Input
							label={t("common:phone")}
							value={formData.phoneNumber || ""}
							onChange={(e) => handleChange("phoneNumber", e.target.value)}
							isInvalid={!!errors.phoneNumber}
							errorMessage={errors.phoneNumber}
						/>

						<Select
							label={t("common:clientType")}
							selectedKeys={[formData.clientType]}
							onChange={(e) => handleChange("clientType", e.target.value)}
							isRequired
						>
							<SelectItem key="user">{t("common:clientTypes.user")}</SelectItem>
							<SelectItem key="company">{t("common:clientTypes.company")}</SelectItem>
						</Select>

						<Select
							label={t("common:paymentType")}
							selectedKeys={formData.paymentType ? [formData.paymentType] : []}
							onChange={(e) => handleChange("paymentType", e.target.value)}
							isRequired
						>
							<SelectItem key="j5">{t("common:paymentTypes.j5")}</SelectItem>
							<SelectItem key="external">{t("common:paymentTypes.external")}</SelectItem>
							<SelectItem key="none">{t("common:paymentTypes.none")}</SelectItem>
						</Select>

						{formData.clientType === "company" && (
							<Input
								label={t("common:companyName")}
								value={formData.companyName || ""}
								onChange={(e) => handleChange("companyName", e.target.value)}
							/>
						)}

						<div className="flex items-center h-full">
							<div className="flex flex-col gap-2">
								<span className="text-sm font-medium">
									{t("admin:clientProfile.accountStatus")}
								</span>
								<Badge color={formData.isAnonymous ? "warning" : "success"} variant="flat">
									{formData.isAnonymous
										? t("admin:clientProfile.anonymous")
										: t("admin:clientProfile.registered")}
								</Badge>
							</div>
						</div>
					</div>
				</CardBody>
			</Card>

			<OrganizationManagementCard
				profile={formData}
				onOrganizationChange={(organizationId: string | undefined) =>
					handleChange("organizationId", organizationId)
				}
			/>

			<Card className="mb-6">
				<CardBody>
					<h2 className="text-xl font-semibold mb-4">
						{t("admin:clientProfile.addressInformation")}
					</h2>
					<AddressForm
						address={formData.address}
						onChange={(address) => handleChange("address", address)}
					/>
				</CardBody>
			</Card>

			<Card className="bg-gray-50 dark:bg-gray-900">
				<CardBody>
					<h2 className="text-xl font-semibold mb-2 text-gray-600 dark:text-gray-400">
						{t("admin:clientProfile.systemInformation")}
					</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
						{t("admin:clientProfile.systemInfoDescription")}
					</p>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Input
							label={t("admin:clientProfile.clientId")}
							value={formData.id}
							isReadOnly
							isDisabled
							variant="flat"
							startContent={<Icon icon="lucide:fingerprint" className="text-default-400" />}
							classNames={{
								input: "text-gray-500 cursor-not-allowed",
								inputWrapper: "bg-gray-100 dark:bg-gray-800",
							}}
						/>

						<Input
							label={t("admin:clientProfile.companyId")}
							value={formData.companyId}
							isReadOnly
							isDisabled
							variant="flat"
							startContent={<Icon icon="lucide:building" className="text-default-400" />}
							classNames={{
								input: "text-gray-500 cursor-not-allowed",
								inputWrapper: "bg-gray-100 dark:bg-gray-800",
							}}
						/>

						<Input
							label={t("admin:clientProfile.storeId")}
							value={formData.storeId}
							isReadOnly
							isDisabled
							variant="flat"
							startContent={<Icon icon="lucide:store" className="text-default-400" />}
							classNames={{
								input: "text-gray-500 cursor-not-allowed",
								inputWrapper: "bg-gray-100 dark:bg-gray-800",
							}}
						/>

						<Input
							label={t("admin:clientProfile.tenantId")}
							value={formData.tenantId}
							isReadOnly
							isDisabled
							variant="flat"
							startContent={<Icon icon="lucide:layers" className="text-default-400" />}
							classNames={{
								input: "text-gray-500 cursor-not-allowed",
								inputWrapper: "bg-gray-100 dark:bg-gray-800",
							}}
						/>
					</div>
				</CardBody>
			</Card>

			<div className="mt-6 flex justify-end gap-2">
				<Button variant="flat" color="default">
					{t("common:cancel")}
				</Button>
				<Button
					color="primary"
					type="submit"
					isLoading={isSubmitting}
					startContent={!isSubmitting && <Icon icon="lucide:save" />}
				>
					{t("admin:clientProfile.saveChanges")}
				</Button>
			</div>
		</form>
	);
};

interface OrganizationManagementCardProps {
	profile: TProfile;
	onOrganizationChange: (organizationId: string | undefined) => void;
}

const OrganizationManagementCard: React.FC<OrganizationManagementCardProps> = ({
	profile,
	onOrganizationChange,
}) => {
	const { t } = useTranslation(["common", "admin"]);
	const appApi = useAppApi();
	const [organizations, setOrganizations] = useState<TOrganization[]>([]);
	const [selectedOrganization, setSelectedOrganization] = useState<TOrganization | null>(null);
	const [loading, setLoading] = useState(false);

	// Load organizations and current organization
	useEffect(() => {
		loadOrganizations();
	}, []);

	useEffect(() => {
		if (profile.organizationId && organizations.length > 0) {
			const org = organizations.find((o) => o.id === profile.organizationId);
			setSelectedOrganization(org || null);
		} else {
			setSelectedOrganization(null);
		}
	}, [profile.organizationId, organizations]);

	const loadOrganizations = async () => {
		setLoading(true);
		try {
			const result = await appApi.admin.listOrganizations();
			if (result?.success) {
				setOrganizations(result.data || []);
			}
		} catch (error) {
			console.error("Failed to load organizations:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleOrganizationSelect = (organizationId: string) => {
		if (organizationId === "none" || organizationId === "") {
			onOrganizationChange(undefined);
		} else {
			onOrganizationChange(organizationId);
		}
	};

	const handleRemoveFromOrganization = () => {
		onOrganizationChange(undefined);
	};

	return (
		<Card className="mb-6">
			<CardBody>
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold">
						{t("admin:clientProfile.organizationManagement")}
					</h2>
					{loading && <Spinner size="sm" />}
				</div>

				<div className="space-y-4">
					{selectedOrganization ? (
						<div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
							<div className="flex items-center gap-3">
								<Icon icon="lucide:building-2" className="text-primary text-xl" />
								<div>
									<h3 className="font-semibold">{selectedOrganization.name}</h3>
									{selectedOrganization.discountPercentage && (
										<p className="text-sm text-default-500">
											{t("admin:clientProfile.discount")}:{" "}
											{selectedOrganization.discountPercentage}%
										</p>
									)}
									{selectedOrganization.nameOnInvoice && (
										<p className="text-sm text-default-500">
											{t("admin:clientProfile.invoiceName")}:{" "}
											{selectedOrganization.nameOnInvoice}
										</p>
									)}
								</div>
							</div>
							<Button
								size="sm"
								color="danger"
								variant="light"
								onPress={handleRemoveFromOrganization}
								startContent={<Icon icon="lucide:x" />}
							>
								{t("admin:clientProfile.removeFromOrganization")}
							</Button>
						</div>
					) : (
						<div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
							<Icon icon="lucide:building-2" className="text-default-400 text-xl" />
							<div>
								<p className="text-default-600">
									{t("admin:clientProfile.noOrganizationAssigned")}
								</p>
								<p className="text-sm text-default-400">
									{t("admin:clientProfile.selectOrganizationBelow")}
								</p>
							</div>
						</div>
					)}

					<div>
													<Select
								label={t("admin:clientProfile.assignToOrganization")}
								placeholder={t("admin:clientProfile.selectOrganization")}
								selectedKeys={selectedOrganization ? [selectedOrganization.id] : []}
								onChange={(e) => handleOrganizationSelect(e.target.value)}
								isDisabled={loading}
								startContent={<Icon icon="lucide:building-2" className="text-default-400" />}
								items={[{ id: "none", name: t("admin:clientProfile.noOrganization") }, ...organizations]}
							>
								{(org) => (
									<SelectItem textValue={org.name} key={org.id}>
										{org.name}
										{org.discountPercentage &&
											` (${org.discountPercentage}% ${t("admin:clientProfile.discount")})`}
									</SelectItem>
								)}
							</Select>
					</div>

					{organizations.length === 0 && !loading && (
						<div className="text-center py-4">
							<p className="text-default-500 mb-2">
								{t("admin:clientProfile.noOrganizationsFound")}
							</p>
							<Button
								size="sm"
								color="primary"
								variant="light"
								onPress={() => {
									navigate({ to: "admin.organizations" });
								}}
								startContent={<Icon icon="lucide:plus" />}
							>
								{t("admin:clientProfile.createOrganization")}
							</Button>
						</div>
					)}
				</div>
			</CardBody>
		</Card>
	);
};

export default function AdminClientProfile() {
	const { t } = useTranslation(["common", "admin"]);
	const params = useParams("admin.clientProfile");
	const clientId = params.id;
	const appApi = useAppApi();

	const [client, setClient] = useState<TProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	async function updateProfile(updatedProfile: TProfile) {
		try {
			const result = await appApi.admin.updateClient(updatedProfile);
			if (result?.success) {
				setClient(updatedProfile);
				console.log("Profile updated successfully");
			} else {
				console.error("Failed to update profile:", result);
			}
		} catch (error) {
			console.error("Error updating profile:", error);
		}
	}

	function removeProfile() {
		// TODO: Implement profile removal logic
		console.log("Removing profile");
	}

	useEffect(() => {
		if (!clientId) return;

		setLoading(true);
		appApi.admin
			.getClient(clientId)
			.then((res) => {
				if (res?.success) {
					setClient(res.data);
					setError(null);
				} else {
					setError(t("admin:clientProfile.clientProfileNotFound"));
				}
			})
			.catch((err) => {
				console.error("Error fetching client:", err);
				setError(t("admin:clientProfile.errorLoadingProfile"));
			})
			.finally(() => {
				setLoading(false);
			});
	}, [clientId]);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Spinner size="lg" color="primary" />
			</div>
		);
	}

	if (error || !client) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen p-4">
				<h2 className="text-2xl font-bold text-danger mb-2">
					{t("admin:clientProfile.errorLoadingProfile")}
				</h2>
				<p className="text-default-600">
					{error || t("admin:clientProfile.clientProfileNotFound")}
				</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8 max-w-5xl">
			<ClientProfileHeader profile={client} onRemove={removeProfile} />
			<div className="mt-6">
				<ClientProfileForm profile={client} onSubmit={updateProfile} />
			</div>
		</div>
	);
}
