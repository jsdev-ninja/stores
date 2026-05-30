import * as functionsV2 from "firebase-functions/v2";
import { saveProduct as saveProductService } from "../services/saveProduct";

/**
 * Admin-only callable: create or update (upsert) a product.
 *
 * Matches the client-side productCreate() / FirebaseApi.firestore.setV2() behaviour:
 *   - create-or-patch via merge-set (setDoc with { merge: true })
 *   - doc id = sku, id = sku, objectID = sku
 *   - undefined fields stripped before write
 *
 * Auth requirements:
 *   - Must be authenticated (auth present).
 *   - Must have admin claim: token.admin === true.
 *   - companyId and storeId are taken from token claims — client-supplied values are ignored.
 *
 * Image upload to Firebase Storage is performed CLIENT-SIDE before calling this endpoint;
 * the product payload must already contain the resolved image URL(s).
 */
export const saveProduct = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request) => {
		const { auth, data } = request;

		if (!auth?.token.admin) {
			return { success: false as const, error: "Unauthorized" };
		}

		const companyId = auth.token.companyId as string;
		const storeId = auth.token.storeId as string;

		const product = await saveProductService({
			product: data,
			companyId,
			storeId,
		});

		return { success: true as const, data: { id: product.id } };
	},
);
