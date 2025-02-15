import { z } from "zod";
import { AddressSchema } from "./Address";
export const ProfileSchema = z.object({
    type: z.literal("Profile"),
    id: z.string(),
    companyId: z.string(),
    storeId: z.string(),
    tenantId: z.string(),
    clientType: z.enum(["user", "company"]),
    displayName: z.string().min(1),
    email: z.string().email(),
    phoneNumber: z.object({
        code: z.string(),
        number: z.string(),
    }),
    address: AddressSchema,
    isAnonymous: z.boolean(),
    createdDate: z.number(),
    lastActivityDate: z.number(),
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
        phoneNumber: { code: "+972", number: "" },
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
    };
}
