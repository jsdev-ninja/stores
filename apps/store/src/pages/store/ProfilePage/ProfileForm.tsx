import React from "react";
import {
	Input,
	Button,
	RadioGroup,
	Radio,
	Checkbox,
	Select,
	SelectItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { ProfileSchema, TProfile } from "@jsdev_ninja/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

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
	const { t } = useTranslation(["profilePage", "common"]);
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
				className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 border-0"
			>
				<h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
					<Icon icon="lucide:user" className="text-primary-500" width={20} />
					{t("profilePage:basicInfo")}
				</h2>
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

					<div className="col-span-full">
						<RadioGroup
							label={t("common:clientType")}
							orientation="horizontal"
							{...form.register("clientType")}
							className="bg-white dark:bg-gray-800 rounded-lg p-4 border-0 shadow-sm"
						>
							<Radio value="user">{t("common:individual")}</Radio>
							<Radio value="company">{t("common:company")}</Radio>
						</RadioGroup>
					</div>

					{formData.clientType === "company" && (
						<Input
							label={t("common:companyName")}
							{...form.register("companyName")}
							className="col-span-full md:col-span-1"
						/>
					)}

					<Select
						{...form.register("paymentType")}
						label={t("common:paymentType")}
						selectedKeys={formData.paymentType ? [formData.paymentType] : []}
						onChange={(e) => handleChange("paymentType", e.target.value)}
						className="col-span-full md:col-span-1"
					>
						<SelectItem key="default">{t("profilePage:paymentTypeDefault" as any)}</SelectItem>
						<SelectItem key="delayed">{t("profilePage:paymentTypeDelayed" as any)}</SelectItem>
					</Select>

					<div className="col-span-full">
						<Checkbox
							isDisabled
							isSelected={formData.isAnonymous}
							onValueChange={(value) => handleChange("isAnonymous", value)}
						>
							{t("common:anonymousUser")}
						</Checkbox>
					</div>
				</div>
			</motion.section>

			<motion.section
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3, delay: 0.1 }}
				className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 border-0"
			>
				<h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
					<Icon icon="lucide:map-pin" className="text-primary-500" width={20} />
					{t("profilePage:addressInfo")}
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Input
						label={t("common:country")}
						value={formData.address?.country || ""}
						onChange={(e) => handleAddressChange("country", e.target.value)}
					/>

					<Input
						label={t("common:city")}
						value={formData.address?.city || ""}
						onChange={(e) => handleAddressChange("city", e.target.value)}
					/>

					<Input
						label={t("common:street")}
						value={formData.address?.street || ""}
						onChange={(e) => handleAddressChange("street", e.target.value)}
					/>

					<Input
						label={t("common:streetNumber")}
						value={formData.address?.streetNumber || ""}
						onChange={(e) => handleAddressChange("streetNumber", e.target.value)}
					/>

					<Input
						label={t("common:floor")}
						value={formData.address?.floor || ""}
						onChange={(e) => handleAddressChange("floor", e.target.value)}
					/>

					<Input
						label={t("common:apartmentEnterNumber")}
						value={formData.address?.apartmentEnterNumber || ""}
						onChange={(e) => handleAddressChange("apartmentEnterNumber", e.target.value)}
					/>

					<Input
						label={t("common:apartmentNumber")}
						value={formData.address?.apartmentNumber || ""}
						onChange={(e) => handleAddressChange("apartmentNumber", e.target.value)}
					/>
				</div>
			</motion.section>

			<motion.section
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3, delay: 0.2 }}
				className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 border-0"
			>
				<h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
					<Icon icon="lucide:settings" className="text-primary-500" width={20} />
					{t("profilePage:systemInfo")}
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Input
						label={t("profilePage:systemFieldUserId" as any)}
						value={formData.id}
						onChange={(e) => handleChange("id", e.target.value)}
						isRequired
						isInvalid={!!errors["id"]}
						errorMessage={errors["id"]}
					/>

					<Input
						label={t("profilePage:systemFieldCompanyId" as any)}
						value={formData.companyId}
						onChange={(e) => handleChange("companyId", e.target.value)}
						isRequired
						isInvalid={!!errors["companyId"]}
						errorMessage={errors["companyId"]}
					/>

					<Input
						label={t("profilePage:systemFieldStoreId" as any)}
						value={formData.storeId}
						onChange={(e) => handleChange("storeId", e.target.value)}
						isRequired
						isInvalid={!!errors["storeId"]}
						errorMessage={errors["storeId"]}
					/>

					<Input
						label={t("profilePage:systemFieldTenantId" as any)}
						value={formData.tenantId}
						onChange={(e) => handleChange("tenantId", e.target.value)}
						isRequired
						isInvalid={!!errors["tenantId"]}
						errorMessage={errors["tenantId"]}
					/>
				</div>
			</motion.section>

			<div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
				<Button
					variant="flat"
					onPress={onCancel}
					disabled={isSaving}
					className="min-w-24"
				>
					{t("common:actions.cancel")}
				</Button>
				<Button
					color="primary"
					type="submit"
					isLoading={isSaving}
					className="min-w-32 shadow-md hover:shadow-lg transition-shadow"
					startContent={!isSaving && <Icon icon="lucide:save" width={18} />}
				>
					{t("profilePage:saveChanges")}
				</Button>
			</div>
		</form>
	);
};
