import { z } from "zod";
import { AddressSchema } from "./Address";
import { PaymentTypeSchema } from "./Payment";

export const clientTypesSchema = z.enum(["individual", "company"]);

export const StoreSchema = z.object({
	id: z.string(),
	companyId: z.string(),
	name: z.string(),
	urls: z.array(z.string()),
	logoUrl: z.string(),
	tenantId: z.string(), // firebase auth tenantId
	paymentType: PaymentTypeSchema,
	allowAnonymousClients: z.boolean(),
	isVatIncludedInPrice: z.boolean(),
	clientTypes: z.array(clientTypesSchema),
	minimumOrder: z.number().optional(),
	freeDeliveryPrice: z.number().optional(),
	deliveryPrice: z.number().optional(),
	address: AddressSchema.optional(),
	companyNumber: z.string().optional(), // חפ של החברה
});

export type TStore = z.infer<typeof StoreSchema>;
