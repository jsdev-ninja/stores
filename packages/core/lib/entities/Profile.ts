import { z } from "zod";
import { AddressSchema } from "./Address";
import { notEmptyTextSchema } from "./Atoms";

export const ProfilePaymentTypeSchema = z.enum(["default", "delayed"]);
export type TProfilePaymentType = z.infer<typeof ProfilePaymentTypeSchema>;

export const ProfileSchema = z.object({
	type: z.literal("Profile"),
	id: notEmptyTextSchema,
	companyId: notEmptyTextSchema,
	storeId: notEmptyTextSchema,
	tenantId: notEmptyTextSchema,
	clientType: z.enum(["user", "company"]),
	displayName: notEmptyTextSchema,
	email: z.string().email(),
	phoneNumber: notEmptyTextSchema.optional(),
	address: AddressSchema.optional(),
	isAnonymous: z.boolean(),
	createdDate: z.number(),
	lastActivityDate: z.number(),
	paymentType: ProfilePaymentTypeSchema,
});

export type TProfile = z.infer<typeof ProfileSchema>;

export function createEmptyProfile(): TProfile {
	return {
		type: "Profile",
		id: "",
		companyId: "",
		storeId: "",
		tenantId: "",
		clientType: "user",
		displayName: "",
		email: "",
		phoneNumber: "",
		address: {
			country: "",
			city: "",
			street: "",
			streetNumber: "",
			floor: "",
			apartmentEnterNumber: "",
			apartmentNumber: "",
		},
		createdDate: 0,
		lastActivityDate: 0,
		isAnonymous: true,
		paymentType: ProfilePaymentTypeSchema.Values.default,
	};
}
