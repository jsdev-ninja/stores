import { z } from "zod";

export const LocaleSchema = z.object({
	lang: z.string(),
	value: z.string(),
});

export type TLocale = z.infer<typeof LocaleSchema>;

export type NestedKeys<T> = T extends object
	? {
			[K in keyof T]: K extends string
				? T[K] extends (infer U)[]
					? `${K}` | `${K}[${number}]` | `${K}[${number}].${NestedKeys<U>}`
					: `${K}` | `${K}.${NestedKeys<T[K]>}`
				: never;
	  }[keyof T]
	: never;
