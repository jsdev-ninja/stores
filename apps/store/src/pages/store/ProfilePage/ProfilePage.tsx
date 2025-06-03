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

interface UserProfilePageProps {
	onProfileUpdate: (profile: TProfile) => void;
}

const ProfilePage: React.FC<UserProfilePageProps> = ({ onProfileUpdate }) => {
	const [isEditing, setIsEditing] = React.useState(false);
	const [isSaving, setIsSaving] = React.useState(false);
	const { t } = useTranslation(["profilePage", "common"]);

	const appApi = useAppApi();

	const profile = useProfile();

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

	console.log("is", isEditing);

	return (
		<div className="container mx-auto px-4 py-8 max-w-3xl text-start">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
			>
				<Card className="shadow-sm">
					<CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
						<div>
							<h1 className="text-xl font-semibold">{t("profilePage:title")}</h1>
							<p className="text-small text-default-500">
								{isEditing ? t("profilePage:subTitleEdit") : t("profilePage:subTitleView")}
							</p>
						</div>
						{!isEditing && (
							<Button
								color="primary"
								variant="flat"
								startContent={<Icon icon="lucide:edit" width={18} />}
								onPress={() => setIsEditing(true)}
							>
								{t("profilePage:editProfile")}
							</Button>
						)}
					</CardHeader>
					<Divider />
					<CardBody>
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
	);
};

export default ProfilePage;
