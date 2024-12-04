import { z } from "zod";
import { ProductSchema } from "./Product";
export const CartSchema = z.object({
    type: z.literal("Cart"),
    id: z.string().uuid(),
    companyId: z.string().uuid(),
    storeId: z.string().uuid(),
    userId: z.string().uuid(),
    status: z.enum(["active", "draft", "completed"]),
    items: z.array(z.object({
        product: ProductSchema,
        amount: z.number().int().positive({ message: "Quantity must be a positive integer." }),
    })),
});
