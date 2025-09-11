import { z } from "zod";

// client organization for clients
export const OrganizationSchema = z.object({
	id: z.string(),
	name: z.string(),
	discountPercentage: z.number().positive().min(0).max(100).optional(),
	nameOnInvoice: z.string().optional(),
	billingAccounts: z.array(
		z.object({
			number: z.string(),
			name: z.string(),
			id: z.string(),
		})
	),
});

export const NewOrganizationSchema = OrganizationSchema.omit({ id: true });

export type TNewOrganization = z.infer<typeof NewOrganizationSchema>;
export type TOrganization = z.infer<typeof OrganizationSchema>;
