import { z } from "zod";
export const CompanySchema = z.object({
    id: z.string(),
    name: z.string(),
    websiteDomains: z.array(z.string()),
});
