import { z } from "zod";
import { AddressSchema } from "./Address";
import { notEmptyTextSchema } from "./Atoms";
export const ProfilePaymentTypeSchema = z.enum(["default", "delayed"], {
    description: "delayed is J5 transaction",
});
export const ProfileSchema = z.object({
    type: z.literal("Profile"),
    id: notEmptyTextSchema,
    companyId: notEmptyTextSchema,
    storeId: notEmptyTextSchema,
    tenantId: notEmptyTextSchema,
    clientType: z.enum(["user", "company"]),
    companyName: z.string().optional(),
    displayName: notEmptyTextSchema,
    email: z.string().email(),
    phoneNumber: z.string().optional(),
    address: AddressSchema.optional(),
    isAnonymous: z.boolean(),
    createdDate: z.number(),
    lastActivityDate: z.number(),
    paymentType: ProfilePaymentTypeSchema,
});
export function createEmptyProfile() {
    return {
        type: "Profile",
        id: "",
        companyId: "",
        storeId: "",
        tenantId: "",
        clientType: "user",
        displayName: "",
        email: "",
        phoneNumber: "",
        address: {
            country: "",
            city: "",
            street: "",
            streetNumber: "",
            floor: "",
            apartmentEnterNumber: "",
            apartmentNumber: "",
        },
        createdDate: 0,
        lastActivityDate: 0,
        isAnonymous: true,
        paymentType: ProfilePaymentTypeSchema.Values.default,
    };
}
