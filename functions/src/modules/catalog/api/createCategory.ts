import * as functionsV2 from "firebase-functions/v2";
import { appendCategory } from "../services/appendCategory";

/**
 * Admin-only callable: append a single category to the store's category tree.
 *
 * Auth requirements:
 *   - Must be authenticated (auth present).
 *   - Must have admin claim: token.admin === true.
 *   - companyId and storeId are taken from token claims — client-supplied values are ignored.
 *
 * Rejects with ALREADY_EXISTS if a category with the same id already exists.
 *
 * Categories are stored as a single doc at {companyId}/{storeId}/categories/categories
 * with a `categories: TCategory[]` array field.
 */
export const createCategory = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request) => {
		const { auth, data } = request;

		if (!auth?.token.admin) {
			return { success: false as const, error: "Unauthorized" };
		}

		const companyId = auth.token.companyId as string;
		const storeId = auth.token.storeId as string;

		const category = await appendCategory({
			category: data,
			companyId,
			storeId,
		});

		return { success: true as const, data: { id: category.id } };
	},
);
