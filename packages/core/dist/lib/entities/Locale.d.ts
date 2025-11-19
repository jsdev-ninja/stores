import { z } from "zod";
export declare const LocaleSchema: z.ZodObject<{
    lang: z.ZodEnum<["he"]>;
    value: z.ZodString;
}, "strip", z.ZodTypeAny, {
    value: string;
    lang: "he";
}, {
    value: string;
    lang: "he";
}>;
export declare const LocaleValueSchema: z.ZodArray<z.ZodObject<{
    lang: z.ZodEnum<["he"]>;
    value: z.ZodString;
}, "strip", z.ZodTypeAny, {
    value: string;
    lang: "he";
}, {
    value: string;
    lang: "he";
}>, "many">;
//# sourceMappingURL=Locale.d.ts.map