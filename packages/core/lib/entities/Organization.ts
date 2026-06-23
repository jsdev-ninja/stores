import { z } from "zod";
import { PaymentTypeSchema } from "./Payment";
import { AddressSchema } from "./Address";

// Payment terms are an ADMIN-ONLY billing attribute — never exposed to the customer.
export const PaymentTermsSchema = z.enum([
	"credit",
	"net15",
	"net30",
	"net60",
	"net90",
]);
export type TPaymentTerms = z.infer<typeof PaymentTermsSchema>;

export const BillingAccountSchema = z.object({
	number: z.string(),
	name: z.string(),
	id: z.string(),
	// Optional, admin-managed billing config (see company-edit-like-demo plan, Phase 2)
	payTerms: PaymentTermsSchema.optional(),
	creditLimit: z.number().optional(),
	isPrimary: z.boolean().optional(),
	// Optional category restriction — when `restricted`, the account is limited to
	// `allowedCategories` (category ids). Order-time enforcement is a separate concern.
	restricted: z.boolean().optional(),
	allowedCategories: z.array(z.string()).optional(),
});

// A physical branch / office of the organization (admin-managed, optional).
export const BranchSchema = z.object({
	id: z.string(),
	label: z.string(),
	address: z.string().optional(),
	phone: z.string().optional(),
	isPrimary: z.boolean().optional(),
});
export type TBranch = z.infer<typeof BranchSchema>;

// client organization for clients
export const OrganizationSchema = z.object({
	id: z.string(),
	name: z.string(),
	discountPercentage: z.number().positive().min(0).max(100).optional(),
	nameOnInvoice: z.string().optional(),
	billingAccounts: z.array(BillingAccountSchema),
	paymentType: PaymentTypeSchema,
	companyNumber: z.string().optional(),
	address: AddressSchema.optional(),
	groupId: z.string().optional(),
	// Contact / billing details (admin-managed, optional — see company-edit-like-demo plan)
	phone: z.string().optional(),
	email: z.string().optional(),
	notes: z.string().optional(),
	freeShipping: z.boolean().optional(),
	branches: z.array(BranchSchema).optional(),
});

export const NewOrganizationSchema = OrganizationSchema.omit({ id: true });

export type TBillingAccount = z.infer<typeof BillingAccountSchema>;
export type TNewOrganization = z.infer<typeof NewOrganizationSchema>;
export type TOrganization = z.infer<typeof OrganizationSchema>;
