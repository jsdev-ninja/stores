import { z } from "zod";
import { hypBooleanSchema } from "./Atoms";

export * from "./Atoms";
export * from "./Payment";

// secret private sub collection

export const CompanyPrivateSchema = z.object({
	owner: z.object({
		name: z.string(),
		emails: z.object({
			mainEmail: z.string(),
		}),
	}),
});
export type TCompanyPrivate = z.infer<typeof CompanyPrivateSchema>;

export const StorePrivateScheme = z.object({
	hypData: z.object({
		masof: z.string().min(1),
		password: z.string().min(1),
		isJ5: hypBooleanSchema,
		KEY: z.string().min(1), // api key
	}),
	storeEmail: z.string().email(),
});
export type TStorePrivate = z.infer<typeof StorePrivateScheme>;
