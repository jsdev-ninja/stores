import { z } from "zod";
export const notEmptyTextSchema = z.string().min(1, { message: "שדה חובה" });
export const numericTextSchema = z.string().regex(/^\d+$/, "Must be a numeric string");
export const FileSchema = z.object({ url: z.string().url(), id: z.string() });
export function isFile(file) {
    return !!file?.url;
}
