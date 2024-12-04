import { z } from "zod";
export declare const ProfileSchema: z.ZodObject<{
    type: z.ZodLiteral<"Profile">;
    id: z.ZodString;
    companyId: z.ZodString;
    storeId: z.ZodString;
    tenantId: z.ZodString;
    clientType: z.ZodEnum<["user", "company"]>;
    displayName: z.ZodString;
    email: z.ZodString;
    phoneNumber: z.ZodObject<{
        code: z.ZodString;
        number: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        number: string;
        code: string;
    }, {
        number: string;
        code: string;
    }>;
    address: z.ZodObject<{
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
    isAnonymous: z.ZodBoolean;
    createdDate: z.ZodNumber;
    lastActivityDate: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "Profile";
    id: string;
    companyId: string;
    storeId: string;
    tenantId: string;
    clientType: "user" | "company";
    displayName: string;
    email: string;
    phoneNumber: {
        number: string;
        code: string;
    };
    address: {
        country: string;
        city: string;
        street: string;
        streetNumber: string;
        floor: string;
        apartmentEnterNumber: string;
        apartmentNumber: string;
    };
    isAnonymous: boolean;
    createdDate: number;
    lastActivityDate: number;
}, {
    type: "Profile";
    id: string;
    companyId: string;
    storeId: string;
    tenantId: string;
    clientType: "user" | "company";
    displayName: string;
    email: string;
    phoneNumber: {
        number: string;
        code: string;
    };
    address: {
        country: string;
        city: string;
        street: string;
        streetNumber: string;
        floor: string;
        apartmentEnterNumber: string;
        apartmentNumber: string;
    };
    isAnonymous: boolean;
    createdDate: number;
    lastActivityDate: number;
}>;
export type TProfile = z.infer<typeof ProfileSchema>;
export declare function createEmptyProfile(): TProfile;
//# sourceMappingURL=Profile.d.ts.map