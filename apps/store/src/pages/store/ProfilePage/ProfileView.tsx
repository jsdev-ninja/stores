import React from "react";
import { Chip, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";
import { TProfile } from "@jsdev_ninja/core";
import { useTranslation } from "react-i18next";

interface ProfileViewProps {
	profile: TProfile;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile }) => {
	const { t } = useTranslation(["profilePage", "common"]);

	return (
		<div className="space-y-6 text-start">
			<section className="">
				<h2 className="text-medium font-semibold mb-3">{t("profilePage:basicInfo")}</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<InfoItem label={t("common:fullName")} value={profile.displayName} />
					<InfoItem label={t("common:email")} value={profile.email} icon="lucide:mail" />
					<InfoItem
						label={t("common:phone")}
						value={profile.phoneNumber || t("common:emptyField")}
						icon="lucide:phone"
					/>
					<InfoItem
						label={t("common:clientType")}
						value={
							<Chip
								color={profile.clientType === "company" ? "primary" : "default"}
								variant="flat"
								size="sm"
							>
								{profile.clientType === "company"
									? t("common:company")
									: t("common:individual")}
							</Chip>
						}
					/>
					{profile.clientType === "company" && profile.companyName && (
						<InfoItem label={t("common:companyName")} value={profile.companyName} />
					)}
					<InfoItem
						label={t("common:paymentType")}
						value={
							<Chip
								color={profile.paymentType === "external" ? "secondary" : "success"}
								variant="flat"
								size="sm"
							>
								{profile.paymentType === "external"
									? t("common:paymentTypes.external")
									: t("common:paymentTypes.j5")}
							</Chip>
						}
					/>
				</div>
			</section>

			<Divider />

			<section>
				<h2 className="text-medium font-semibold mb-3">{t("addressInfo")}</h2>
				{profile.address ? (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<InfoItem
							label={t("common:country")}
							value={profile.address.country || t("common:emptyField")}
						/>
						<InfoItem
							label={t("common:city")}
							value={profile.address.city || t("common:emptyField")}
						/>
						<InfoItem
							label={t("common:street")}
							value={profile.address.street || t("common:emptyField")}
						/>
						<InfoItem
							label={t("common:streetNumber")}
							value={profile.address.streetNumber || t("common:emptyField")}
						/>
						<InfoItem
							label={t("common:floor")}
							value={profile.address.floor || t("common:emptyField")}
						/>
						<InfoItem
							label={t("common:apartmentEnterNumber")}
							value={profile.address.apartmentEnterNumber || t("common:emptyField")}
						/>
						<InfoItem
							label={t("common:apartmentNumber")}
							value={profile.address.apartmentNumber || t("common:emptyField")}
						/>
					</div>
				) : (
					<p className="text-default-500">אין כתובת להצגה</p>
				)}
			</section>

			<Divider />

			{/* todo admin only data */}
			{/* <section>
				<h2 className="text-medium font-semibold mb-3">{t("profilePage:systemInfo")}</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<InfoItem label="User ID" value={profile.id} monospace />
					<InfoItem label="Company ID" value={profile.companyId} monospace />
					<InfoItem label="Store ID" value={profile.storeId} monospace />
					<InfoItem label="Tenant ID" value={profile.tenantId} monospace />
					<InfoItem
						label="Created Date"
						value={formatDate(profile.createdDate)}
						icon="lucide:calendar"
					/>
					<InfoItem
						label="Last Activity"
						value={formatDate(profile.lastActivityDate)}
						icon="lucide:clock"
					/>
					<InfoItem
						label="Anonymous User"
						value={
							<Chip
								color={profile.isAnonymous ? "warning" : "success"}
								variant="flat"
								size="sm"
							>
								{profile.isAnonymous ? "Yes" : "No"}
							</Chip>
						}
					/>
				</div>
			</section> */}
		</div>
	);
};

interface InfoItemProps {
	label: string;
	value: React.ReactNode;
	icon?: string;
	monospace?: boolean;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value, icon, monospace = false }) => {
	return (
		<div className="space-y-1">
			<p className="text-small text-default-500">{label}</p>
			<div className="flex items-center gap-2">
				{icon && <Icon icon={icon} className="text-default-400" width={16} />}
				<p className={`${monospace ? "font-mono text-small" : ""}`}>{value}</p>
			</div>
		</div>
	);
};
