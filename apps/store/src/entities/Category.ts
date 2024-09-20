import { z } from "zod";

export const CategorySchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(2, { message: "Category name must be at least 2 characters long." }),
	description: z.string().optional(),
	parentCategoryId: z.string().uuid().optional(), // Reference to parent Category ID
	createdAt: z.date().default(new Date()),
	updatedAt: z.date().optional(),
});
