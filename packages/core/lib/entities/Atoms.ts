import { z } from "zod";

// 600 - Checking a card number700 - Approved without charge800 - Postpone transaction - success handle ass error

export const hypBooleanSchema = z.enum(["True", "False"]);
export const notEmptyTextSchema = z.string().min(1);
export const numericTextSchema = z.string().regex(/^\d+$/, "Must be a numeric string");
