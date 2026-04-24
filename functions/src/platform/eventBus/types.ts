import { z } from "zod";

export const EventSource = z.enum([
	"orders",
	"payments",
	"fulfillment",
	"catalog",
	"cart",
	"budget",
	"customers",
	"webhooks",
	"notifications",
]);
export type EventSource = z.infer<typeof EventSource>;

export const StoredEventSchema = z.object({
	id: z.string().min(1),
	type: z.string().regex(/^[a-z_]+\.[a-z_]+$/, {
		message: "type must be 'module.action' (lowercase, dot-separated)",
	}),
	payload: z.unknown(),
	companyId: z.string().min(1).refine((s) => !s.includes("/"), {
		message: "companyId must not contain '/'",
	}),
	storeId: z.string().min(1).refine((s) => !s.includes("/"), {
		message: "storeId must not contain '/'",
	}),
	createdAt: z.number().int().positive(),
	correlationId: z.string().optional(),
	actorId: z.string().optional(),
	source: EventSource.optional(),
});

export type StoredEvent<T = unknown> =
	Omit<z.infer<typeof StoredEventSchema>, "payload"> & { payload: T };
