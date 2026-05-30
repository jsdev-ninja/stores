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
						placeholder={t("common:fullName")}
					/>

					<div className="relative">
						<Icon icon="lucide:mail" className="text-default-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
						<Input
							{...form.register("email")}
							type="email"
							disabled
							className="ps-9"
						/>
					</div>

					<div className="relative">
						<Icon icon="lucide:phone" className="text-default-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
						<Input
							{...form.register("phoneNumber")}
							placeholder={t("common:phone")}
							className="ps-9"
						/>
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
					<Input placeholder={t("common:country")} {...form.register("address.country")} />

					<Input placeholder={t("common:city")} {...form.register("address.city")} />

					<Input placeholder={t("common:street")} {...form.register("address.street")} />

					<Input placeholder={t("common:streetNumber")} {...form.register("address.streetNumber")} />

					<Input placeholder={t("common:floor")} {...form.register("address.floor")} />

					<Input
						placeholder={t("common:apartmentEnterNumber")}
						{...form.register("address.apartmentEnterNumber")}
					/>

					<Input
						placeholder={t("common:apartmentNumber")}
						{...form.register("address.apartmentNumber")}
					/>
				</div>
			</motion.section>

			<div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
				<Button variant="ghost" onPress={onCancel} isDisabled={isSaving} className="min-w-24">
					{t("common:actions.cancel")}
				</Button>
				<Button
					variant="primary"
					type="submit"
					isPending={isSaving}
					className="min-w-32 shadow-md hover:shadow-lg transition-shadow"
				>
					{!isSaving && <Icon icon="lucide:save" width={18} />}
					{t("profilePage:saveChanges")}
				</Button>
			</div>
		</form>
	);
};
