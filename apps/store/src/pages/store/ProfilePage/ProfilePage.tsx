import React from "react";
import { Card, CardBody, CardHeader, Divider, Button, addToast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { ProfileForm } from "./ProfileForm";
import { ProfileView } from "./ProfileView";
import { TProfile } from "@jsdev_ninja/core";
import { useTranslation } from "react-i18next";
import { useProfile } from "src/domains/profile";
import { useAppApi } from "src/appApi";
import { useAppSelector } from "src/infra/store";

const ProfilePage = () => {
	const [isEditing, setIsEditing] = React.useState(false);
	const [isSaving, setIsSaving] = React.useState(false);
	const { t } = useTranslation(["profilePage", "common"]);

	const appApi = useAppApi();
	const user = useAppSelector((state) => state.user.user);

	const profile = useProfile();
	console.log("profile", profile);
	console.log("user", user);

	const handleSave = async (updatedProfile: TProfile) => {
		setIsSaving(true);

		console.log("update profile", updatedProfile);

		try {
			// Simulate API call
			const res = await appApi.user.profileUpdate({ profile: updatedProfile });
			console.log("res", res);

			setIsEditing(false);
			addToast({
				title: "Profile Updated",
				description: "Your profile has been successfully updated.",
				color: "success",
			});
		} catch (error) {
			console.log("error", error);

			addToast({
				title: "Update Failed",
				description: "There was an error updating your profile.",
				color: "danger",
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancel = () => {
		setIsEditing(false);
	};

	if (!profile) {
		// todo
		return null;
	}

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
			<div className="container mx-auto px-4 max-w-4xl text-start">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
				>
					<Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3),0_1px_2px_-1px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.1)] border-0">
						<CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between px-6 pt-6 pb-4">
							<div>
								<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
									{t("profilePage:title")}
								</h1>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
									{isEditing ? t("profilePage:subTitleEdit") : t("profilePage:subTitleView")}
								</p>
							</div>
							{!isEditing && (
								<Button
									color="primary"
									variant="flat"
									className="bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30"
									startContent={<Icon icon="lucide:edit" width={18} />}
									onPress={() => setIsEditing(true)}
								>
									{t("profilePage:editProfile")}
								</Button>
							)}
						</CardHeader>
						<Divider className="bg-gray-200 dark:bg-gray-700" />
						<CardBody className="px-6 py-6">
							{isEditing ? (
								<ProfileForm
									profile={profile}
									onSave={handleSave}
									onCancel={handleCancel}
									isSaving={isSaving}
								/>
							) : (
								<ProfileView profile={profile} />
							)}
						</CardBody>
					</Card>
				</motion.div>
			</div>
		</div>
	);
};

export default ProfilePage;
