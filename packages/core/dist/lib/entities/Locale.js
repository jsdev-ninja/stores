import { z } from "zod";
export const LocaleSchema = z.object({
    lang: z.enum(["he"]),
    value: z.string(),
});
export const LocaleValueSchema = z.array(LocaleSchema);
