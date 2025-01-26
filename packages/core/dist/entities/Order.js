import { z } from "zod";
import { AddressSchema } from "./Address";
import { ProfileSchema } from "./Profile";
import { ProductSchema } from "./Product";
// pending - order created / by user
// processing order accepted by store by admin
// delivered - order delivered by admin
// canceled - order canceled by user/admin
// completed - order paid by admin
// type PaymentMethod = "credit_card" | "paypal" | "bank_transfer" | "cash_on_delivery";
export const OrderSchema = z.object({
    type: z.literal("Order"),
    id: z.string(),
    companyId: z.string(),
    storeId: z.string(),
    userId: z.string(),
    status: z.enum(["pending", "processing", "delivered", "canceled", "completed", "refunded"]),
    paymentStatus: z.enum(["pending", "completed", "failed", "refunded"]),
    cart: z.object({
        id: z.string(),
        items: z.array(z.object({ product: ProductSchema, amount: z.number() })),
        cartTotal: z.number(),
        cartDiscount: z.number(),
        cartVat: z.number(),
    }),
    date: z.number(),
    deliveryDate: z.number().optional(),
    client: ProfileSchema,
    address: AddressSchema,
});
