import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { deleteProductDoc } from "../internal/productsStore";

type DeleteProductInput = {
	productId: string;
	companyId: string;
	storeId: string;
};

/**
 * Delete a product by id.
 * Rejects if the product doesn't exist (returns not-found).
 *
 * NOTE: image removal from Firebase Storage is intentionally NOT handled here.
 * The client continues to perform Storage cleanup independently.
 */
export async function deleteProduct({ productId, companyId, storeId }: DeleteProductInput): Promise<void> {
	const { existed } = await deleteProductDoc(companyId, storeId, productId);
	if (!existed) {
		throw new HttpsError("not-found", `No product found with id "${productId}".`);
	}
	logger.info("deleteProduct: success", { productId, companyId, storeId });
}
