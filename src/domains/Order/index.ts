import { z } from "zod";

export const OrderSchema = z.object({
	id: z.string(),
	companyId: z.string(),
	storeId: z.string(),
	status: z.enum(["pending", "inProgress", "delivered", " paid", "canceled", "rejected"]),
	cart: z.array(z.object({})), // todo
});

export type TOrder = z.infer<typeof OrderSchema>;

export const OrderApi = {
	createOrder: async () => {},
};
