import { z } from "zod";
export const notEmptyTextSchema = z.string().min(1);
export const numericTextSchema = z.string().regex(/^\d+$/, "Must be a numeric string");
