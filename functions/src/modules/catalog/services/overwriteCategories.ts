import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { CategorySchema, TCategory } from "@jsdev_ninja/core";
import { z } from "zod";
import { overwriteCategoriesDoc } from "../internal/categoriesStore";

type OverwriteCategoriesInput = {
	/** Raw categories array from the callable request. */
	categories: unknown;
	companyId: string;
	storeId: string;
};

/**
 * Validate and overwrite the full categories array on the single-doc categories model.
 * companyId and storeId are always overridden from the admin token on each category.
 *
 * Each element is validated with CategorySchema (recursive). We use z.array(z.unknown())
 * for the outer parse to avoid TypeScript's infinite-type instantiation limit on the
 * recursive CategorySchema, then validate each item individually.
 */
export async function overwriteCategories({
	categories: raw,
	companyId,
	storeId,
}: OverwriteCategoriesInput): Promise<TCategory[]> {
	// First check that the input is an array at all
	const arrayCheck = z.array(z.unknown()).safeParse(raw);
	if (!arrayCheck.success) {
		throw new HttpsError("invalid-argument", "categories must be an array");
	}

	// Validate each element individually using the recursive CategorySchema
	const categories: TCategory[] = [];
	for (let i = 0; i < arrayCheck.data.length; i++) {
		const itemResult = CategorySchema.safeParse(arrayCheck.data[i]);
		if (!itemResult.success) {
			logger.warn("overwriteCategories: validation failed", { index: i, issues: itemResult.error.issues });
			throw new HttpsError("invalid-argument", `Invalid category at index ${i}`, itemResult.error.issues);
		}
		categories.push({ ...itemResult.data, companyId, storeId });
	}

	await overwriteCategoriesDoc(companyId, storeId, categories);

	logger.info("overwriteCategories: success", { count: categories.length, companyId, storeId });
	return categories;
}
