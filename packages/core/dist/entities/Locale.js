import { z } from "zod";
export const LocaleSchema = z.object({
    lang: z.string().min(1),
    value: z.string().min(1),
});
