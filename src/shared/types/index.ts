import { z } from "zod";

export const LocaleSchema = z.object({
	lang: z.string().min(1),
	value: z.string().min(1),
});

export type TLocale = z.infer<typeof LocaleSchema>;

// export type NestedKeys<T> = {
// 	[K in keyof T]: T[K] extends object
// 		? K extends string
// 			? `${K}` | `${K}.${NestedKeys<T[K]>}`
// 			: never
// 		: K extends string
// 		? `${K}`
// 		: never;
// }[keyof T];

// todo: autocomplete not works for array of objects
export type NestedKeys<T> = {
	[K in keyof T]: T[K] extends Array<infer U>
		? K extends string
			? `${K}` | `${K}[${number}]` | `${K}[${number}].${NestedKeys<U>}`
			: never
		: T[K] extends object
		? K extends string
			? `${K}` | `${K}.${NestedKeys<T[K]>}`
			: never
		: K extends string
		? `${K}`
		: never;
}[keyof T];
