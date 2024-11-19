import { z } from "zod";

// 6. Address Schema
export const AddressSchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(), // Reference to User ID
	street: z.string().min(1, { message: "Street is required." }),
	city: z.string().min(1, { message: "City is required." }),
	state: z.string().min(1, { message: "State is required." }),
	country: z.string().min(1, { message: "Country is required." }),
	zipCode: z.string().min(1, { message: "Zip code is required." }),
	isDefault: z.boolean().default(false),
	createdAt: z.date().default(new Date()),
	updatedAt: z.date().optional(),
});
