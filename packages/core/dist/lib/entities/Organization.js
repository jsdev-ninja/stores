import { z } from "zod";
export const BillingAccountSchema = z.object({
    number: z.string(),
    name: z.string(),
    id: z.string(),
});
// client organization for clients
export const OrganizationSchema = z.object({
    id: z.string(),
    name: z.string(),
    discountPercentage: z.number().positive().min(0).max(100).optional(),
    nameOnInvoice: z.string().optional(),
    billingAccounts: z.array(BillingAccountSchema),
    paymentType: z.enum(["default", "delayed"]),
});
export const NewOrganizationSchema = OrganizationSchema.omit({ id: true });
