import { z } from "zod";
import { hypBooleanSchema } from "./Atoms";
const StoreSchema = z.object({
    id: z.string(),
    companyId: z.string(),
    name: z.string(),
    urls: z.array(z.string()),
    logoUrl: z.string(),
    tenantId: z.string(), // firebase auth tenantId
    hypData: z.object({
        masof: z.string().min(1),
        password: z.string().min(1),
        isJ5: hypBooleanSchema,
        KEY: z.string().min(1), // api key
    }),
});
// private sub collection
export const StorePrivateSchema = z.object({
    storeEmail: z.string().email(),
});
