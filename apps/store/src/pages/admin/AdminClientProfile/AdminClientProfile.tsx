import React, { useEffect, useState } from "react";
import {
	Card,
	CardBody,
	Input,
	Button,
	Checkbox,
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
import { useParams } from "src/navigation";
import { useAppApi } from "src/appApi";

interface AddressFormProps {
	address?: TProfile["address"];
	onChange: (address: TProfile["address"]) => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ address, onChange }) => {
	const [formData, setFormData] = React.useState<TProfile["address"]>(
		address || {
			street: "",
			city: "",
			country: "israel",
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
				label="Street Address"
				value={formData?.street}
				onChange={(e) => handleChange("street", e.target.value)}
				className="md:col-span-2"
			/>

			<Input
				label="City"
				value={formData?.city}
				onChange={(e) => handleChange("city", e.target.value)}
			/>

			{/* <Select
				label="Country"
				selectedKeys={[formData.country]}
				onChange={(e) => handleChange("country", e.target.value)}
			>
				{COUNTRIES.map((country) => (
					<SelectItem key={country.code} value={country.code}>
						{country.name}
					</SelectItem>
				))}
			</Select> */}
		</div>
	);
};

const formatDate = (timestamp: number): string => {
	const date = new Date(timestamp);
	return new Intl.DateTimeFormat("en-US", {
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
					<div className="flex items-center gap-2">
						<Badge color={profile.clientType === "company" ? "primary" : "secondary"}>
							{profile.clientType === "company" ? "Company" : "Individual"}
						</Badge>
						{profile.isAnonymous && <Badge color="warning">Anonymous</Badge>}
					</div>
					<div className="text-sm text-default-500">
						<div>Created: {formatDate(profile.createdDate)}</div>
						<div>Last Activity: {formatDate(profile.lastActivityDate)}</div>
					</div>
				</div>

				<Button
					color="danger"
					variant="light"
					startContent={<Icon icon="lucide:trash-2" />}
					onPress={onOpen}
				>
					Remove Client
				</Button>
			</div>

			<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">Confirm Removal</ModalHeader>
							<ModalBody>
								<p>
									Are you sure you want to remove <strong>{profile.displayName}</strong>?
									This action cannot be undone.
								</p>
							</ModalBody>
							<ModalFooter>
								<Button variant="light" onPress={onClose}>
									Cancel
								</Button>
								<Button color="danger" onPress={handleRemove} isLoading={isDeleting}>
									Remove Client
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
			newErrors.displayName = "Display name is required";
		}

		if (!formData.email.trim()) {
			newErrors.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = "Invalid email format";
		}

		if (formData.phoneNumber && formData.phoneNumber.trim() === "") {
			newErrors.phoneNumber = "Phone number cannot be empty";
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
					<h2 className="text-xl font-semibold mb-4">Basic Information</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Input
							label="Display Name"
							value={formData.displayName}
							onChange={(e) => handleChange("displayName", e.target.value)}
							isRequired
							isInvalid={!!errors.displayName}
							errorMessage={errors.displayName}
						/>

						<Input
							label="Email"
							type="email"
							value={formData.email}
							onChange={(e) => handleChange("email", e.target.value)}
							isRequired
							isInvalid={!!errors.email}
							errorMessage={errors.email}
						/>

						<Input
							label="Phone Number"
							value={formData.phoneNumber || ""}
							onChange={(e) => handleChange("phoneNumber", e.target.value)}
							isInvalid={!!errors.phoneNumber}
							errorMessage={errors.phoneNumber}
						/>

						<Select
							label="Client Type"
							selectedKeys={[formData.clientType]}
							onChange={(e) => handleChange("clientType", e.target.value)}
							isRequired
						>
							<SelectItem key="user">Individual</SelectItem>
							<SelectItem key="company">Company</SelectItem>
						</Select>

						<Select
							label="Payment Type"
							selectedKeys={[formData.paymentType]}
							onChange={(e) => handleChange("paymentType", e.target.value)}
							isRequired
						>
							<SelectItem key="credit_card">Credit Card</SelectItem>
							<SelectItem key="paypal">PayPal</SelectItem>
							<SelectItem key="bank_transfer">Bank Transfer</SelectItem>
							<SelectItem key="crypto">Cryptocurrency</SelectItem>
						</Select>

						<div className="flex items-center h-full">
							<Checkbox
								isSelected={formData.isAnonymous}
								onValueChange={(value) => handleChange("isAnonymous", value)}
							>
								Anonymous Account
							</Checkbox>
						</div>
					</div>
				</CardBody>
			</Card>

			<Card className="mb-6">
				<CardBody>
					<h2 className="text-xl font-semibold mb-4">Address Information</h2>
					<AddressForm
						address={formData.address}
						onChange={(address) => handleChange("address", address)}
					/>
				</CardBody>
			</Card>

			<Card>
				<CardBody>
					<h2 className="text-xl font-semibold mb-4">System Information</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Input
							label="Client ID"
							value={formData.id}
							isReadOnly
							startContent={<Icon icon="lucide:fingerprint" className="text-default-400" />}
						/>

						<Input
							label="Company ID"
							value={formData.companyId}
							isReadOnly
							startContent={<Icon icon="lucide:building" className="text-default-400" />}
						/>

						<Input
							label="Store ID"
							value={formData.storeId}
							isReadOnly
							startContent={<Icon icon="lucide:store" className="text-default-400" />}
						/>

						<Input
							label="Tenant ID"
							value={formData.tenantId}
							isReadOnly
							startContent={<Icon icon="lucide:layers" className="text-default-400" />}
						/>
					</div>
				</CardBody>
			</Card>

			<div className="mt-6 flex justify-end gap-2">
				<Button variant="flat" color="default">
					Cancel
				</Button>
				<Button
					color="primary"
					type="submit"
					isLoading={isSubmitting}
					startContent={!isSubmitting && <Icon icon="lucide:save" />}
				>
					Save Changes
				</Button>
			</div>
		</form>
	);
};

export default function AdminClientProfile() {
	function updateProfile() {}
	function removeProfile() {}
	const error = null;

	const params = useParams("admin.clientProfile");
	const clientId = params.id;
	console.log("clientId", clientId);

	const appApi = useAppApi();

	const [client, setClient] = useState<TProfile | null>(null);
	const [loading, setLoading] = useState(false);
	console.log("loading", loading, setLoading);

	useEffect(() => {
		if (!clientId) return;
		appApi.admin.getClient(clientId).then((res) => {
			console.log("res", res);
			if (res?.success) {
				setClient(res.data);
			}
		});
	}, [clientId]);

	if (false) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Spinner size="lg" color="primary" />
			</div>
		);
	}

	if (error || !client) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen p-4">
				<h2 className="text-2xl font-bold text-danger mb-2">Error Loading Profile</h2>
				<p className="text-default-600">{error || "Client profile not found"}</p>
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
