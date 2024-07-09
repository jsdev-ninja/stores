import { z } from "zod";

// custom.d.ts
declare global {
	interface Document {
		startViewTransition?: (callback?: () => void) => void;
	}
}

export const AddressSchema = z.object({
	city: z.string({}).min(1, {}),
	street: z.string().min(1),
});
export type TAddress = z.infer<typeof AddressSchema>;
