import { z } from "zod";
export declare const notEmptyTextSchema: z.ZodString;
export declare const numericTextSchema: z.ZodString;
export declare const FileSchema: z.ZodObject<{
    url: z.ZodString;
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    url: string;
    id: string;
}, {
    url: string;
    id: string;
}>;
export type TFile = z.infer<typeof FileSchema>;
export declare function isFile(file: any): file is TFile;
//# sourceMappingURL=Atoms.d.ts.map