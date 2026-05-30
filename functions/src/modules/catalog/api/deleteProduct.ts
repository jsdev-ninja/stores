import * as functionsV2 from "firebase-functions/v2";
import { z } from "zod";
import { HttpsError } from "firebase-functions/v2/https";
import { deleteProduct as deleteProductService } from "../services/deleteProduct";

const DeleteProductInput = z.object({
	productId: z.string().min(1),
});

/**
 * Admin-only callable: delete a product by id.
 *
 * Auth requirements:
 *   - Must be authenticated (auth present).
 *   - Must have admin claim: token.admin === true.
 *   - companyId and storeId are taken from token claims — client-supplied values are ignored.
 *
 * Rejects with NOT_FOUND if the product does not exist.
 *
 * NOTE: image removal from Firebase Storage is intentionally NOT handled here.
 * The client performs Storage cleanup independently (same as the current client-side flow).
 */
export const deleteProduct = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request) => {
		const { auth, data } = request;

		if (!auth?.token.admin) {
			return { success: false as const, error: "Unauthorized" };
		}

		const companyId = auth.token.companyId as string;
		const storeId = auth.token.storeId as string;

		const parsed = DeleteProductInput.safeParse(data);
		if (!parsed.success) {
			throw new HttpsError("invalid-argument", "productId is required");
		}

		await deleteProductService({
			productId: parsed.data.productId,
			companyId,
			storeId,
		});

		return { success: true as const };
	},
);
