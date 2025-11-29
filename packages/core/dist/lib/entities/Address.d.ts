import { z } from "zod";
export declare const AddressSchema: z.ZodObject<{
    country: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    street: z.ZodOptional<z.ZodString>;
    streetNumber: z.ZodOptional<z.ZodString>;
    floor: z.ZodOptional<z.ZodString>;
    apartmentEnterNumber: z.ZodOptional<z.ZodString>;
    apartmentNumber: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    country?: string | undefined;
    city?: string | undefined;
    street?: string | undefined;
    streetNumber?: string | undefined;
    floor?: string | undefined;
    apartmentEnterNumber?: string | undefined;
    apartmentNumber?: string | undefined;
}, {
    country?: string | undefined;
    city?: string | undefined;
    street?: string | undefined;
    streetNumber?: string | undefined;
    floor?: string | undefined;
    apartmentEnterNumber?: string | undefined;
    apartmentNumber?: string | undefined;
}>;
export type TAddress = z.infer<typeof AddressSchema>;
//# sourceMappingURL=Address.d.ts.map