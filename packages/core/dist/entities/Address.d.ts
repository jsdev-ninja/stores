import { z } from "zod";
export declare const AddressSchema: z.ZodObject<{
    country: z.ZodString;
    city: z.ZodString;
    street: z.ZodString;
    streetNumber: z.ZodString;
    floor: z.ZodString;
    apartmentEnterNumber: z.ZodString;
    apartmentNumber: z.ZodString;
}, "strip", z.ZodTypeAny, {
    country: string;
    city: string;
    street: string;
    streetNumber: string;
    floor: string;
    apartmentEnterNumber: string;
    apartmentNumber: string;
}, {
    country: string;
    city: string;
    street: string;
    streetNumber: string;
    floor: string;
    apartmentEnterNumber: string;
    apartmentNumber: string;
}>;
export type TAddress = z.infer<typeof AddressSchema>;
//# sourceMappingURL=Address.d.ts.map