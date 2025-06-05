import React from "react";
import {
	Input,
	Button,
	RadioGroup,
	Radio,
	Checkbox,
	Select,
	SelectItem,
	Divider,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { ProfileSchema, TProfile } from "@jsdev_ninja/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { t } from "i18next";

interface ProfileFormProps {
	profile: TProfile;
	onSave: (profile: TProfile) => void;
	onCancel: () => void;
	isSaving: boolean;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
	profile,
	onSave,
	onCancel,
	isSaving,
}) => {
	const [formData, setFormData] = React.useState<TProfile>({ ...profile });
	const [errors, setErrors] = React.useState<Record<string, string>>({});

	const form = useForm<TProfile>({
		resolver: zodResolver(ProfileSchema),
		defaultValues: profile,
	});

	const handleChange = (field: keyof TProfile, value: any) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));

		// Clear error when field is edited
		if (errors[field]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[field];
				return newErrors;
			});
		}
	};

	const handleAddressChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			address: {
				...prev.address!,
				[field]: value,
			},
		}));

		// Clear error when field is edited
		const errorKey = `address.${field}`;
		if (errors[errorKey]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[errorKey];
				return newErrors;
			});
		}
	};

	const handleSubmit = (newProfile: TProfile) => {
		console.log("newProfile", newProfile);
		onSave(newProfile);
	};

	console.log("form", form.watch());

	return (
		<form
			onSubmit={form.handleSubmit(handleSubmit, console.error)}
			className="space-y-6 text-start"
		>
			<motion.section
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3 }}
			>
				<h2 className="text-medium font-semibold mb-3">Basic Information</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Input
						{...form.register("displayName")}
						label={t("common:fullName")}
						isInvalid={!!errors["displayName"]}
						errorMessage={errors["displayName"]}
					/>

					<Input
						{...form.register("email")}
						label={t("common:email")}
						type="email"
						isInvalid={!!errors["email"]}
						errorMessage={errors["email"]}
						startContent={<Icon icon="lucide:mail" className="text-default-400" />}
					/>

					<Input
						label={t("common:phone")}
						{...form.register("phoneNumber")}
						startContent={<Icon icon="lucide:phone" className="text-default-400" />}
					/>

					<RadioGroup
						label={t("clientType")}
						orientation="horizontal"
						{...form.register("clientType")}
					>
						<Radio value="user">{t("individual")}</Radio>
						<Radio value="company">{t("company")}</Radio>
					</RadioGroup>

					{formData.clientType === "company" && (
						<Input
							label={t("companyName")}
							{...form.register("companyName")}
							className="col-span-full md:col-span-1"
						/>
					)}

					<Select
						{...form.register("paymentType")}
						label="Payment Type"
						selectedKeys={[formData.paymentType]}
						onChange={(e) => handleChange("paymentType", e.target.value)}
						className="col-span-full md:col-span-1"
					>
						<SelectItem key="default">Default Payment</SelectItem>
						<SelectItem key="delayed">Delayed Payment</SelectItem>
					</Select>

					<div className="col-span-full">
						<Checkbox
							isDisabled
							isSelected={formData.isAnonymous}
							onValueChange={(value) => handleChange("isAnonymous", value)}
						>
							{t("anonymousUser")}
						</Checkbox>
					</div>
				</div>
			</motion.section>

			<Divider />

			<motion.section
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3, delay: 0.1 }}
			>
				<h2 className="text-medium font-semibold mb-3">Address</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Input
						label="Country"
						value={formData.address?.country || ""}
						onChange={(e) => handleAddressChange("country", e.target.value)}
					/>

					<Input
						label="City"
						value={formData.address?.city || ""}
						onChange={(e) => handleAddressChange("city", e.target.value)}
					/>

					<Input
						label="Street"
						value={formData.address?.street || ""}
						onChange={(e) => handleAddressChange("street", e.target.value)}
					/>

					<Input
						label="Street Number"
						value={formData.address?.streetNumber || ""}
						onChange={(e) => handleAddressChange("streetNumber", e.target.value)}
					/>

					<Input
						label="Floor"
						value={formData.address?.floor || ""}
						onChange={(e) => handleAddressChange("floor", e.target.value)}
					/>

					<Input
						label="Apartment Enter Number"
						value={formData.address?.apartmentEnterNumber || ""}
						onChange={(e) => handleAddressChange("apartmentEnterNumber", e.target.value)}
					/>

					<Input
						label="Apartment Number"
						value={formData.address?.apartmentNumber || ""}
						onChange={(e) => handleAddressChange("apartmentNumber", e.target.value)}
					/>
				</div>
			</motion.section>

			<Divider />

			<motion.section
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3, delay: 0.2 }}
			>
				<h2 className="text-medium font-semibold mb-3">System Information</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Input
						label="User ID"
						value={formData.id}
						onChange={(e) => handleChange("id", e.target.value)}
						isRequired
						isInvalid={!!errors["id"]}
						errorMessage={errors["id"]}
					/>

					<Input
						label="Company ID"
						value={formData.companyId}
						onChange={(e) => handleChange("companyId", e.target.value)}
						isRequired
						isInvalid={!!errors["companyId"]}
						errorMessage={errors["companyId"]}
					/>

					<Input
						label="Store ID"
						value={formData.storeId}
						onChange={(e) => handleChange("storeId", e.target.value)}
						isRequired
						isInvalid={!!errors["storeId"]}
						errorMessage={errors["storeId"]}
					/>

					<Input
						label="Tenant ID"
						value={formData.tenantId}
						onChange={(e) => handleChange("tenantId", e.target.value)}
						isRequired
						isInvalid={!!errors["tenantId"]}
						errorMessage={errors["tenantId"]}
					/>
				</div>
			</motion.section>

			<div className="flex justify-end gap-2 pt-4">
				<Button variant="flat" onPress={onCancel} disabled={isSaving}>
					Cancel
				</Button>
				<Button
					color="primary"
					type="submit"
					isLoading={isSaving}
					startContent={!isSaving && <Icon icon="lucide:save" width={18} />}
				>
					Save Changes
				</Button>
			</div>
		</form>
	);
};
