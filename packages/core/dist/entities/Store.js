import { z } from "zod";
const StoreSchema = z.object({
    id: z.string(),
    companyId: z.string(),
    name: z.string(),
    urls: z.array(z.string()),
    logoUrl: z.string(),
    tenantId: z.string(), // firebase auth tenantId
    paymentMethods: z
        .array(z.object({
        clientType: z.enum(["user", "company"]),
        method: z.enum(["internal", "external"]),
    }))
        .optional(),
});
// private sub collection
export const StorePrivateSchema = z.object({
    storeEmail: z.string().email(),
});
