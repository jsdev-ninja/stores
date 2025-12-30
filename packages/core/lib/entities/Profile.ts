import { z } from "zod";
import { AddressSchema } from "./Address";
import { notEmptyTextSchema } from "./Atoms";
import { PaymentTypeSchema } from "./Payment";

export const ProfileSchema = z.object({
	type: z.literal("Profile"),
	id: notEmptyTextSchema,
	companyId: notEmptyTextSchema,
	storeId: notEmptyTextSchema,
	tenantId: notEmptyTextSchema,
	clientType: z.enum(["user", "company"]),
	companyName: z.string().optional(),
	displayName: notEmptyTextSchema,
	email: z.string().email(),
	phoneNumber: z.string().optional(),
	address: AddressSchema.optional(),
	isAnonymous: z.boolean(),
	createdDate: z.number(),
	lastActivityDate: z.number(),
	paymentType: PaymentTypeSchema.optional(),
	organizationId: z.string().optional().nullable(),
});

export type TProfile = z.infer<typeof ProfileSchema>;
