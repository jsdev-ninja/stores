import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { CategorySchema, TCategory } from "@jsdev_ninja/core";
import { appendCategoryDoc } from "../internal/categoriesStore";

type AppendCategoryInput = {
	/** Raw category payload from the callable request. */
	category: unknown;
	companyId: string;
	storeId: string;
};

/**
 * Validate and append a single category to the single-doc categories array.
 *
 * The read, duplicate-id check, and write are performed inside a Firestore
 * transaction (in appendCategoryDoc) so concurrent appends are safe.
 *
 * Rejects with ALREADY_EXISTS if a category with the same id already exists.
 * companyId and storeId are always overridden from the admin token.
 */
export async function appendCategory({ category: raw, companyId, storeId }: AppendCategoryInput): Promise<TCategory> {
	const result = CategorySchema.safeParse(raw);
	if (!result.success) {
		logger.warn("appendCategory: validation failed", { issues: result.error.issues });
		throw new HttpsError("invalid-argument", "Invalid category data", result.error.issues);
	}

	const category: TCategory = {
		...result.data,
		companyId,
		storeId,
	};

	try {
		await appendCategoryDoc(companyId, storeId, category);
	} catch (err: unknown) {
		if (isAlreadyExistsError(err)) {
			throw new HttpsError("already-exists", `A category with id "${category.id}" already exists.`);
		}
		throw err;
	}

	logger.info("appendCategory: success", { categoryId: category.id, companyId, storeId });
	return category;
}

function isAlreadyExistsError(err: unknown): boolean {
	if (err == null || typeof err !== "object") return false;
	const e = err as Record<string, unknown>;
	return (
		e["code"] === "ALREADY_EXISTS" ||
		e["code"] === 6 ||
		String(e["message"]).includes("already exists")
	);
}
