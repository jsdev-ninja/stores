import { z } from "zod";

// payment type priority -> store -> organization -> profile (profile is stronger)
// value fixed on order creation, can be changed later by admin

export const PaymentTypeSchema = z.enum(["external", "j5", "none"]);

export type TPaymentType = z.infer<typeof PaymentTypeSchema>;
