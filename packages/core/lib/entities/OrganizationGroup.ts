import { z } from "zod";

// client organization for clients
export const OrganizationGroupSchema = z.object({
	id: z.string(),
	name: z.string(),
});

export const NewOrganizationGroupSchema = OrganizationGroupSchema.omit({ id: true });

export type TNewOrganizationGroup = z.infer<typeof NewOrganizationGroupSchema>;
export type TOrganizationGroup = z.infer<typeof OrganizationGroupSchema>;
