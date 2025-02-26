import { z } from "zod";

export const LocaleSchema = z.object({
	lang: z.string().min(1),
	value: z.string().min(1),
});

export type TLocale = z.infer<typeof LocaleSchema>;

// todo: autocomplete not works for array of objects
export type NestedKeys<T> = {
	[K in keyof Required<T>]: Required<T>[K] extends Array<infer U>
		? K extends string
			? U extends object
				?
						| `${K}`
						| `${K}[${number}]`
						| (U extends T ? never : `${K}[${number}].${NestedKeys<U>}`)
				: never
			: never
		: Required<T>[K] extends object
		? K extends string
			? `${K}` | `${K}.${NestedKeys<Required<T>[K]>}`
			: never
		: K extends string
		? `${K}`
		: never;
}[keyof T];

// without root key
export type SubNestedKeys<T> = {
	[K in keyof T]: T[K] extends Array<infer U>
		? K extends string
			? `${K}` | `${K}[${number}]` | (U extends T ? never : `${K}[${number}].${NestedKeys<U>}`)
			: never
		: T[K] extends object
		? K extends string
			? `${K}.${NestedKeys<T[K]>}`
			: never
		: K extends string
		? `${K}`
		: never;
}[keyof T];
