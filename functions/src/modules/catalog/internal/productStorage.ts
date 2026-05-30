import admin from "firebase-admin";

export const productStorage = {
	/**
	 * Delete ALL image objects for a product:
	 * `{companyId}/{storeId}/products/{productId}/` (entire prefix).
	 * Idempotent — no-op if the prefix has no objects.
	 *
	 * The trailing slash is critical so deleting sku "1" does NOT also delete "12"/"123".
	 */
	removeAllImages: async (params: { companyId: string; storeId: string; productId: string }) => {
		const { companyId, storeId, productId } = params;
		const prefix = `${companyId}/${storeId}/products/${productId}/`; // trailing slash — must NOT match sibling skus (e.g. "1" vs "12")
		await admin.storage().bucket().deleteFiles({ prefix });
	},
};
