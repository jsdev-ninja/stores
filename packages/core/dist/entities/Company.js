import { z } from "zod";
export const CompanySchema = z.object({
    id: z.string(),
    name: z.string(),
    websiteDomains: z.array(z.string()),
    owner: z.object({
        name: z.string(),
        emails: z.object({
            mainEmail: z.string(),
        }),
    }),
});
