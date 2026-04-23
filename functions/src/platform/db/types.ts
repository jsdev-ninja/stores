import { z } from "zod";
import { storeCollections } from "@jsdev_ninja/core";

export const TenantCtxSchema = z.object({
	companyId: z.string().min(1).refine((s) => !s.includes("/"), {
		message: "companyId must not contain '/'",
	}),
	storeId: z.string().min(1).refine((s) => !s.includes("/"), {
		message: "storeId must not contain '/'",
	}),
});

export type TenantCtx = z.infer<typeof TenantCtxSchema>;

export type CollectionName = keyof typeof storeCollections;
