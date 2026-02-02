import { z } from "zod";



export const payProtocolRequestSchema = z.object({
    Masof: z.string(),
    PassP: z.string(),
    KEY: z.string().optional(),
    Amount: z.string(),
    Order: z.string().optional(),
    Tash: z.string(),
    FixTash: z.boolean().optional(),
    UTF8: z.boolean(),
    UTF8out: z.boolean(),
});

export type TPayProtocolRequest = z.infer<typeof payProtocolRequestSchema>;

export const payProtocolResponseSchema = z.object({
    Id: z.string(),
    ACode: z.string(),
    CCode: z.string(),
    Sign: z.string(),
    Fild1: z.string(),
    Fild2: z.string(),
    Fild3: z.string(),
});

export type TPayProtocolResponse = z.infer<typeof payProtocolResponseSchema>;