import { z } from "zod";
import { LocaleSchema } from "src/shared/types";

export const CategorySchema = z.object({
	id: z.string().min(1),
	companyId: z.string().min(1),
	storeId: z.string().min(1),
	parentId: z.string().min(1),
	tag: z.string().min(1),
	locales: z.array(LocaleSchema),
});

export type TCategory = z.infer<typeof CategorySchema>;
