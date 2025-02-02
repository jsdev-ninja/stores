import { User } from "firebase/auth";
import { z } from "zod";

export * from "./fields";

// extend with custom claims
export type Token = {
	admin?: boolean;
	superAdmin?: boolean;
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
