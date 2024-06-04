import { z } from "zod";

export const LocaleSchema = z.object({
	lang: z.string(),
	value: z.string(),
});

export type TLocale = z.infer<typeof LocaleSchema>;
