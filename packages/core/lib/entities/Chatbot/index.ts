import { z } from "zod";

export const ChatSessionSchema = z.object({
	type: z.literal("ChatSession"),
	id: z.string(),
	storeId: z.string(),
	companyId: z.string(),
	tenantId: z.string(),
	userId: z.string().nullable(),
	userType: z.enum(["anonymous", "client", "admin", "superAdmin"]),
	createdAt: z.number(),
	updatedAt: z.number(),
	messageCount: z.number(),
	status: z.enum(["active", "archived"]),
});

export type TChatSession = z.infer<typeof ChatSessionSchema>;

export const ChatSessionMessageSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("message"),
		id: z.string(),
		role: z.enum(["user", "assistant", "system"]),
		content: z.string(),
		timestamp: z.number(),
	}),
	z.object({
		type: z.literal("function_call"),
		id: z.string(),
		name: z.string(),
		arguments: z.record(z.string(), z.any()),
		timestamp: z.number(),
	}),
	z.object({
		type: z.literal("tool_result"),
		id: z.string(),
		name: z.string(),
		result: z.any(),
		timestamp: z.number(),
	}),
]);

export type TChatSessionMessage = z.infer<typeof ChatSessionMessageSchema>;
