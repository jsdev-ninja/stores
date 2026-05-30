import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { ProductSchema, TProduct } from "@jsdev_ninja/core";
import { upsertProductDoc } from "../internal/productsStore";

type SaveProductInput = {
	/** Raw product payload from the callable request (already tenant-corrected by the api layer). */
	product: unknown;
	companyId: string;
	storeId: string;
};

/**
 * Validate and upsert a product.
 *
 * Matches the client-side productCreate() behaviour exactly:
 *   - id = sku, objectID = sku
 *   - companyId and storeId are always taken from the admin token (not the client payload)
 *   - images preserved from payload (defaults to [])
 *   - undefined fields stripped before write
 *   - write semantics: merge-set (create-or-patch), matching setV2 / setDoc(…,{merge:true})
 */
export async function saveProduct({ product: raw, companyId, storeId }: SaveProductInput): Promise<TProduct> {
	const result = ProductSchema.safeParse(raw);
	if (!result.success) {
		logger.warn("saveProduct: validation failed", { issues: result.error.issues });
		throw new HttpsError("invalid-argument", "Invalid product data", result.error.issues);
	}

	const product: TProduct = {
		...result.data,
		// Override tenant fields from token regardless of client payload
		companyId,
		storeId,
		// Enforce id = sku, objectID = sku — matching client-side convention
		id: result.data.sku,
		objectID: result.data.sku,
		// Preserve images array; default to [] if absent
		images: result.data.images ?? [],
	};

	await upsertProductDoc(product);

	logger.info("saveProduct: success", { productId: product.id, companyId, storeId });
	return product;
}
