import { z } from "zod";
export declare const clientTypesSchema: z.ZodEnum<["individual", "company"]>;
export declare const StoreSchema: z.ZodObject<{
    id: z.ZodString;
    companyId: z.ZodString;
    name: z.ZodString;
    urls: z.ZodArray<z.ZodString, "many">;
    logoUrl: z.ZodString;
    tenantId: z.ZodString;
    paymentType: z.ZodEnum<["external", "j5"]>;
    allowAnonymousClients: z.ZodBoolean;
    isVatIncludedInPrice: z.ZodBoolean;
    clientTypes: z.ZodArray<z.ZodEnum<["individual", "company"]>, "many">;
    minimumOrder: z.ZodOptional<z.ZodNumber>;
    freeDeliveryPrice: z.ZodOptional<z.ZodNumber>;
    deliveryPrice: z.ZodOptional<z.ZodNumber>;
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
}, "strip", z.ZodTypeAny, {
    id: string;
    companyId: string;
    name: string;
    tenantId: string;
    paymentType: "external" | "j5";
    isVatIncludedInPrice: boolean;
    urls: string[];
    logoUrl: string;
    allowAnonymousClients: boolean;
    clientTypes: ("company" | "individual")[];
    address?: {
        country?: string | undefined;
        city?: string | undefined;
        street?: string | undefined;
        streetNumber?: string | undefined;
        floor?: string | undefined;
        apartmentEnterNumber?: string | undefined;
        apartmentNumber?: string | undefined;
    } | undefined;
    deliveryPrice?: number | undefined;
    freeDeliveryPrice?: number | undefined;
    minimumOrder?: number | undefined;
}, {
    id: string;
    companyId: string;
    name: string;
    tenantId: string;
    paymentType: "external" | "j5";
    isVatIncludedInPrice: boolean;
    urls: string[];
    logoUrl: string;
    allowAnonymousClients: boolean;
    clientTypes: ("company" | "individual")[];
    address?: {
        country?: string | undefined;
        city?: string | undefined;
        street?: string | undefined;
        streetNumber?: string | undefined;
        floor?: string | undefined;
        apartmentEnterNumber?: string | undefined;
        apartmentNumber?: string | undefined;
    } | undefined;
    deliveryPrice?: number | undefined;
    freeDeliveryPrice?: number | undefined;
    minimumOrder?: number | undefined;
}>;
export type TStore = z.infer<typeof StoreSchema>;
//# sourceMappingURL=Store.d.ts.map