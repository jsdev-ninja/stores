import { z } from "zod";

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
