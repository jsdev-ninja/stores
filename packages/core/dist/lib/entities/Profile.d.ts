import { z } from "zod";
export declare const ProfilePaymentTypeSchema: z.ZodEnum<["default", "delayed"]>;
export type TProfilePaymentType = z.infer<typeof ProfilePaymentTypeSchema>;
export declare const ProfileSchema: z.ZodObject<{
    type: z.ZodLiteral<"Profile">;
    id: z.ZodString;
    companyId: z.ZodString;
    storeId: z.ZodString;
    tenantId: z.ZodString;
    clientType: z.ZodEnum<["user", "company"]>;
    companyName: z.ZodOptional<z.ZodString>;
    displayName: z.ZodString;
    email: z.ZodString;
    phoneNumber: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodObject<{
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
    }>>;
    isAnonymous: z.ZodBoolean;
    createdDate: z.ZodNumber;
    lastActivityDate: z.ZodNumber;
    paymentType: z.ZodEnum<["default", "delayed"]>;
    organizationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    type: "Profile";
    id: string;
    companyId: string;
    storeId: string;
    tenantId: string;
    clientType: "user" | "company";
    displayName: string;
    email: string;
    isAnonymous: boolean;
    createdDate: number;
    lastActivityDate: number;
    paymentType: "default" | "delayed";
    companyName?: string | undefined;
    phoneNumber?: string | undefined;
    address?: {
        country: string;
        city: string;
        street: string;
        streetNumber: string;
        floor: string;
        apartmentEnterNumber: string;
        apartmentNumber: string;
    } | undefined;
    organizationId?: string | null | undefined;
}, {
    type: "Profile";
    id: string;
    companyId: string;
    storeId: string;
    tenantId: string;
    clientType: "user" | "company";
    displayName: string;
    email: string;
    isAnonymous: boolean;
    createdDate: number;
    lastActivityDate: number;
    paymentType: "default" | "delayed";
    companyName?: string | undefined;
    phoneNumber?: string | undefined;
    address?: {
        country: string;
        city: string;
        street: string;
        streetNumber: string;
        floor: string;
        apartmentEnterNumber: string;
        apartmentNumber: string;
    } | undefined;
    organizationId?: string | null | undefined;
}>;
export type TProfile = z.infer<typeof ProfileSchema>;
export declare function createEmptyProfile(): TProfile;
//# sourceMappingURL=Profile.d.ts.map