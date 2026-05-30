import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { ProductSchema, TProduct } from "@jsdev_ninja/core";
import { createProductDoc } from "../internal/productsStore";

/**
 * Reject SKUs that would corrupt Firestore paths or bypass duplicate guards.
 *
 * Rules:
 *  - No forward slash (would split the doc id into nested segments)
 *  - No ASCII control characters (U+0000–U+001F)
 *  - No leading / trailing whitespace
 *  - Max 256 characters
 */
function assertValidSku(sku: string): void {
	if (sku.length > 256) {
		throw new HttpsError("invalid-argument", "Invalid SKU");
	}
	if (sku !== sku.trim()) {
		throw new HttpsError("invalid-argument", "Invalid SKU");
	}
	if (sku.includes("/")) {
		throw new HttpsError("invalid-argument", "Invalid SKU");
	}
	// eslint-disable-next-line no-control-regex
	if (/[\x00-\x1F]/.test(sku)) {
		throw new HttpsError("invalid-argument", "Invalid SKU");
	}
}

type CreateProductInput = {
	/** Raw product payload from the callable request (already tenant-corrected by the api layer). */
	product: unknown;
	companyId: string;
	storeId: string;
};

/**
 * Validate and atomically create a product.
 *
 * Unlike saveProduct (which uses merge-set / upsert), this service uses
 * `ref.create()` under the hood — an atomic write that fails with gRPC code 6
 * (ALREADY_EXISTS) if a doc with the same SKU already exists.
 *
 *   - id = sku, objectID = sku
 *   - companyId and storeId are always taken from the admin token (not the client payload)
 *   - images preserved from payload (defaults to [])
 *   - undefined fields stripped before write
 *   - duplicate SKU → throws HttpsError("already-exists", "SKU already in use")
 */
export async function createProduct({ product: raw, companyId, storeId }: CreateProductInput): Promise<TProduct> {
	const result = ProductSchema.safeParse(raw);
	if (!result.success) {
		logger.warn("createProduct: validation failed", { issues: result.error.issues });
		throw new HttpsError("invalid-argument", "Invalid product data", result.error.issues);
	}

	try {
		assertValidSku(result.data.sku);
	} catch (e) {
		logger.warn("createProduct: invalid sku rejected", { sku: result.data.sku, companyId, storeId });
		throw e;
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

	try {
		await createProductDoc(product);
	} catch (e: unknown) {
		// gRPC ALREADY_EXISTS = code 6
		// The admin SDK surfaces this as a FirebaseError with .code === 6 (numeric).
		const code = (e as { code?: number | string })?.code;
		if (code === 6 || code === "6") {
			logger.warn("createProduct: duplicate sku rejected", { sku: result.data.sku, companyId, storeId });
			throw new HttpsError("already-exists", "SKU already in use");
		}
		throw e;
	}

	logger.info("createProduct: success", { productId: product.id, companyId, storeId, product });
	return product;
}
