import { z } from "zod";
import { notEmptyTextSchema } from "./Atoms";

export const AddressSchema = z.object({
	country: notEmptyTextSchema,
	city: notEmptyTextSchema,
	street: notEmptyTextSchema,
	streetNumber: notEmptyTextSchema,
	floor: notEmptyTextSchema,
	apartmentEnterNumber: notEmptyTextSchema,
	apartmentNumber: notEmptyTextSchema,
});

export type TAddress = z.infer<typeof AddressSchema>;
