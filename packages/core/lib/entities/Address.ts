import { z } from "zod";

export const AddressSchema = z.object({
	country: z.string().optional(),
	city: z.string().optional(),
	street: z.string().optional(),
	streetNumber: z.string().optional(),
	floor: z.string().optional(),
	apartmentEnterNumber: z.string().optional(),
	apartmentNumber: z.string().optional(),
});

export type TAddress = z.infer<typeof AddressSchema>;
