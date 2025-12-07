import { z } from "zod";
import { ProfileSchema } from "./Profile";
import { notEmptyTextSchema } from "./Atoms";
import { CartItemProductSchema } from "./Cart";
import { DeliveryNoteSchema, EzDeliveryNoteSchema } from "./DeliveryNote";
import { BillingAccountSchema } from "./Organization";
import { EzInvoiceSchema, InvoiceSchema } from "./Invoice";
import { PaymentTypeSchema } from "./Payment";
import { AddressSchema } from "./Address";

// pending - order created / by user
// processing order accepted by store by admin
// delivered - order delivered by admin
// canceled - order canceled by user/admin
// completed - order paid by admin

// type PaymentMethod = "credit_card" | "paypal" | "bank_transfer" | "cash_on_delivery";

export const OrderSchema = z.object({
	type: z.literal("Order"),
	createdBy: z.enum(["user", "admin"]).optional(),
	id: notEmptyTextSchema,
	companyId: notEmptyTextSchema,
	storeId: notEmptyTextSchema,
	userId: notEmptyTextSchema,
	status: z.enum([
		"draft", // before payment
		"pending", // after payment
		"processing", // after admin approve
		"in_delivery", //
		"delivered",
		"cancelled",
		"completed",
		"refunded",
	]),
	paymentType: PaymentTypeSchema.optional(),
	paymentStatus: z.enum(["pending", "pending_j5", "external", "completed", "failed", "refunded"]), //todo check if hyp support partial refund
	cart: z.object({
		id: z.string(),
		items: z.array(CartItemProductSchema),
		cartDiscount: z.number(),
		cartTotal: z.number(),
		cartVat: z.number(),
		deliveryPrice: z.number().optional(), // final delivery price for cart
	}),
	storeOptions: z
		.object({
			deliveryPrice: z.number().optional(),
			freeDeliveryPrice: z.number().optional(),
			isVatIncludedInPrice: z.boolean().optional(),
		})
		.optional(),
	originalAmount: z.number().positive().optional(), // what client pay
	actualAmount: z.number().positive().optional(), // what store charge
	date: z.number(),
	deliveryDate: z.coerce.number(),
	client: ProfileSchema.optional(),
	address: AddressSchema.optional(),
	nameOnInvoice: z.string().optional(),
	emailOnInvoice: z.string().email().optional(),
	phoneNumberOnInvoice: z.string().optional(),
	clientComment: z.string().optional(),
	organizationId: z.string().optional(),
	billingAccount: BillingAccountSchema.optional(),
	deliveryNote: DeliveryNoteSchema.optional(),
	invoice: InvoiceSchema.optional(),
	ezInvoice: EzInvoiceSchema.optional(),
	ezDeliveryNote: EzDeliveryNoteSchema.optional(),
});

export type TOrder = z.infer<typeof OrderSchema>;
