import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";
import { createProduct as createProductService } from "../services/createProduct";

/**
 * Admin-only callable: atomically create a new product.
 *
 * Unlike saveProduct (merge-set / upsert), this endpoint uses `ref.create()` so
 * that a duplicate SKU fails with `HttpsError("already-exists")` rather than
 * silently overwriting the existing product.
 *
 * Auth requirements:
 *   - Must be authenticated (auth present).
 *   - Must have admin claim: token.admin === true.
 *   - companyId and storeId are taken from token claims — client-supplied values are ignored.
 *
 * Success: returns `{ success: true, data: { id: string } }` (id = sku).
 * Duplicate SKU: throws HttpsError "already-exists" ("SKU already in use").
 * Validation failure: throws HttpsError "invalid-argument" ("Invalid product data").
 * Not admin: returns `{ success: false, error: "Unauthorized" }`.
 *
 * Image upload to Firebase Storage is performed CLIENT-SIDE before calling this endpoint;
 * the product payload must already contain the resolved image URL(s).
 */
export const createProduct = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request) => {
		const { auth, data } = request;

		if (!auth?.token.admin) {
			logger.warn("createProduct: unauthorized", { uid: auth?.uid ?? null, isAdmin: auth?.token.admin ?? false });
			return { success: false as const, error: "Unauthorized" };
		}

		const companyId = auth.token.companyId as string;
		const storeId = auth.token.storeId as string;

		const product = await createProductService({
			product: data,
			companyId,
			storeId,
		});

		return { success: true as const, data: { id: product.id } };
	},
);
