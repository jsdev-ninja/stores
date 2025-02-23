import { z } from "zod";
const StoreSchema = z.object({
    id: z.string(),
    companyId: z.string(),
    name: z.string(),
    urls: z.array(z.string()),
    logoUrl: z.string(),
    tenantId: z.string(), // firebase auth tenantId
});
