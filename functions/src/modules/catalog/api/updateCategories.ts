import * as functionsV2 from "firebase-functions/v2";
import { z } from "zod";
import { HttpsError } from "firebase-functions/v2/https";
import { overwriteCategories } from "../services/overwriteCategories";

const UpdateCategoriesInput = z.object({
	categories: z.array(z.unknown()),
});

/**
 * Admin-only callable: overwrite the entire category array on the single-doc categories model.
 *
 * Auth requirements:
 *   - Must be authenticated (auth present).
 *   - Must have admin claim: token.admin === true.
 *   - companyId and storeId are taken from token claims — client-supplied values are ignored.
 *
 * Categories are stored as a single doc at {companyId}/{storeId}/categories/categories
 * with a `categories: TCategory[]` array field. This endpoint replaces the entire array.
 */
export const updateCategories = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request) => {
		const { auth, data } = request;

		if (!auth?.token.admin) {
			return { success: false as const, error: "Unauthorized" };
		}

		const companyId = auth.token.companyId as string;
		const storeId = auth.token.storeId as string;

		const parsed = UpdateCategoriesInput.safeParse(data);
		if (!parsed.success) {
			throw new HttpsError("invalid-argument", "categories array is required");
		}

		const categories = await overwriteCategories({
			categories: parsed.data.categories,
			companyId,
			storeId,
		});

		return { success: true as const, data: { count: categories.length } };
	},
);
