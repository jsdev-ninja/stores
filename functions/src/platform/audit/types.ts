import { z } from "zod";
import { storeCollections } from "@jsdev_ninja/core";

const targetTypeKeys = Object.keys(storeCollections) as [
	keyof typeof storeCollections,
	...Array<keyof typeof storeCollections>,
];
export const TargetType = z.enum(targetTypeKeys);
export type TargetType = z.infer<typeof TargetType>;

export const AuditEntrySchema = z.object({
	id: z.string().min(1),
	eventType: z.string().regex(/^[a-z_]+\.[a-z_]+$/, {
		message: "eventType must be 'domain.verb' (lowercase, dot-separated)",
	}),
	actorId: z.string().min(1),
	targetType: TargetType,
	targetId: z.string().min(1),
	diff: z.array(z.unknown()).optional(),
	summary: z.string().optional(),
	companyId: z.string().min(1).refine((s) => !s.includes("/"), {
		message: "companyId must not contain '/'",
	}),
	storeId: z.string().min(1).refine((s) => !s.includes("/"), {
		message: "storeId must not contain '/'",
	}),
	createdAt: z.number().int().positive(),
	metadata: z
		.object({
			ip: z.string().optional(),
			userAgent: z.string().optional(),
		})
		.optional(),
	correlationId: z.string().optional(),
});

export type AuditEntry = z.infer<typeof AuditEntrySchema>;
