import { z } from "zod";

export const FavoriteProductSchema = z.object({
	type: z.literal("FavoriteProduct"),
	id: z.string().uuid(),
	companyId: z.string().uuid(),
	storeId: z.string().uuid(),
	userId: z.string().uuid(),
	productId: z.string().uuid(),
});

export type TFavoriteProduct = z.infer<typeof FavoriteProductSchema>;
