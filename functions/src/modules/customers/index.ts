import { profileService } from "./internal/profileService";

export const customersModule = {
	async onAuthUserDeleted(input: { uid: string }): Promise<void> {
		await profileService.deleteProfile(input.uid);
	},
};

export { createCompanyClient } from "./api/createCompany";
export { deleteClient } from "./api/deleteClient";
export { migrateProfilesToMultiOrg } from "./api/migrateProfiles";
