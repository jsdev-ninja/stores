import { User } from "firebase/auth";
import { z } from "zod";

export * from "./fields";

// extend with custom claims
export type Token = {
	admin?: boolean;
	storeId?: string;
	tenantId?: string;
};
export type TUser = User & Token;

export const ImageSchema = z.object({ url: z.string().url(), id: z.string() });
export type Image = z.infer<typeof ImageSchema>;

export const passwordSchema = z
	.string()
	.min(6, "Password must be at least 6 characters long.")
	.regex(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
		"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
	);

export const AddressSchema = z.object({
	country: z.string(),
	city: z.string(),
	street: z.string(),
	streetNumber: z.string(),
	floor: z.string(),
	apartmentEnterNumber: z.string(),
	apartmentNumber: z.string(),
});

export type TAddress = z.infer<typeof AddressSchema>;

export const ProfileSchema = z.object({
	type: z.literal("Profile"),
	id: z.string(),
	companyId: z.string(),
	storeId: z.string(),
	tenantId: z.string(),
	clientType: z.enum(["user", "company"]),
	displayName: z.string().min(1),
	email: z.string().email(),
	phoneNumber: z.object({
		code: z.string(),
		number: z.string(),
	}),
	address: z.object({
		country: z.string(),
		city: z.string(),
		street: z.string(),
		streetNumber: z.string(),
		floor: z.string(),
		apartmentEnterNumber: z.string(),
		apartmentNumber: z.string(),
	}),
});
export type TProfile = z.infer<typeof ProfileSchema>;
export type TNewProfile = Omit<TProfile, "id">;

export const NewCompanySchema = ProfileSchema.extend({
	password: passwordSchema,
}).omit({ id: true });

export type TNewCompany = z.infer<typeof NewCompanySchema>;

// custom.d.ts
declare global {
	interface Document {
		startViewTransition?: (callback?: () => void) => void;
	}
}

export type TStoreStats = {
	id: string;
	totalUsers: {
		$overall: { all: number };
		company: { all: number };
		user: { all: number };
	};
	totalPageView: { all: number };
};
