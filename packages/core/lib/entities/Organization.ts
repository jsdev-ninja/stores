import { z } from "zod";
import { PaymentTypeSchema } from "./Payment";

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
	paymentType: PaymentTypeSchema
});

export const NewOrganizationSchema = OrganizationSchema.omit({ id: true });

export type TBillingAccount = z.infer<typeof BillingAccountSchema>;
export type TNewOrganization = z.infer<typeof NewOrganizationSchema>;
export type TOrganization = z.infer<typeof OrganizationSchema>;
