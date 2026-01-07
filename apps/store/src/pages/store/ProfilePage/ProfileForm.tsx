import React from "react";
import { Input, Button } from "@heroui/react";
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

	const form = useForm<TProfile>({
		resolver: zodResolver(ProfileSchema),
		defaultValues: profile,
	});

	const handleSubmit = (newProfile: TProfile) => {
		console.log("newProfile", newProfile);
		onSave(newProfile);
	};

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
						isInvalid={!!form.formState.errors["displayName"]}
						errorMessage={form.formState.errors["displayName"]?.message?.toString() ?? ""}
					/>

					<Input
						{...form.register("email")}
						label={t("common:email")}
						type="email"
						isDisabled
						isInvalid={!!form.formState.errors["email"]}
						errorMessage={form.formState.errors["email"]?.message?.toString() ?? ""}
						startContent={<Icon icon="lucide:mail" className="text-default-400" />}
					/>

					<Input
						label={t("common:phone")}
						{...form.register("phoneNumber")}
						startContent={<Icon icon="lucide:phone" className="text-default-400" />}
					/>
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
					<Input label={t("common:country")} {...form.register("address.country")} />

					<Input label={t("common:city")} {...form.register("address.city")} />

					<Input label={t("common:street")} {...form.register("address.street")} />

					<Input label={t("common:streetNumber")} {...form.register("address.streetNumber")} />

					<Input label={t("common:floor")} {...form.register("address.floor")} />

					<Input
						label={t("common:apartmentEnterNumber")}
						{...form.register("address.apartmentEnterNumber")}
					/>

					<Input
						label={t("common:apartmentNumber")}
						{...form.register("address.apartmentNumber")}
					/>
				</div>
			</motion.section>

			<div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
				<Button variant="flat" onPress={onCancel} disabled={isSaving} className="min-w-24">
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
