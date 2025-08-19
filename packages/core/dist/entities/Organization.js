import { z } from "zod";
// client organization for clients
export const OrganizationSchema = z.object({
    id: z.string(),
    name: z.string(),
    discountPercentage: z.number().positive().min(0).max(100).optional(),
    nameOnInvoice: z.string().optional(),
});
export const NewOrganizationSchema = OrganizationSchema.omit({ id: true });
