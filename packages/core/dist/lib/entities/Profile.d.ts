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
        country?: string | undefined;
        city?: string | undefined;
        street?: string | undefined;
        streetNumber?: string | undefined;
        floor?: string | undefined;
        apartmentEnterNumber?: string | undefined;
        apartmentNumber?: string | undefined;
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
        country?: string | undefined;
        city?: string | undefined;
        street?: string | undefined;
        streetNumber?: string | undefined;
        floor?: string | undefined;
        apartmentEnterNumber?: string | undefined;
        apartmentNumber?: string | undefined;
    } | undefined;
    organizationId?: string | null | undefined;
}>;
export type TProfile = z.infer<typeof ProfileSchema>;
export declare function createEmptyProfile(): TProfile;
//# sourceMappingURL=Profile.d.ts.map