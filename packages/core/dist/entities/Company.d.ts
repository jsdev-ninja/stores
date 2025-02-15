import { z } from "zod";
export declare const CompanySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    websiteDomains: z.ZodArray<z.ZodString, "many">;
    owner: z.ZodObject<{
        name: z.ZodString;
        emails: z.ZodObject<{
            mainEmail: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            mainEmail: string;
        }, {
            mainEmail: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        emails: {
            mainEmail: string;
        };
    }, {
        name: string;
        emails: {
            mainEmail: string;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    websiteDomains: string[];
    owner: {
        name: string;
        emails: {
            mainEmail: string;
        };
    };
}, {
    id: string;
    name: string;
    websiteDomains: string[];
    owner: {
        name: string;
        emails: {
            mainEmail: string;
        };
    };
}>;
export type TCompany = z.infer<typeof CompanySchema>;
//# sourceMappingURL=Company.d.ts.map