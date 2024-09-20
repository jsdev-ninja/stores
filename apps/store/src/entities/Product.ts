import { z } from "zod";

export const ProductSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(2, { message: "Product name must be at least 2 characters long." }),
	description: z.string().optional(),
	price: z.number().positive({ message: "Price must be a positive number." }),
	categoryIds: z.array(z.string().uuid()).optional(), // References to Category IDs
	stock: z.number().int().nonnegative({ message: "Stock must be a non-negative integer." }),
	images: z.array(z.string().url()).optional(),
	createdAt: z.date().default(new Date()),
	updatedAt: z.date().optional(),
});
