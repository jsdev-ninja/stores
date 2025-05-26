import { z } from "zod";

const clientTypesSchema = z.enum(["individual", "company"]);
const StoreSchema = z.object({
	id: z.string(),
	companyId: z.string(),
	name: z.string(),
	urls: z.array(z.string()),
	logoUrl: z.string(),
	tenantId: z.string(), // firebase auth tenantId
	paymentType: z.enum(["external", "j5"]),
	allowAnonymousClients: z.boolean(),
	isVatIncludedInPrice: z.boolean(),
	clientTypes: z.array(clientTypesSchema),
	minimumOrder: z.number().optional(),
	freeDeliveryPrice: z.number().optional(),
	deliveryPrice: z.number().optional(),
});
export type TStore = z.infer<typeof StoreSchema>;
