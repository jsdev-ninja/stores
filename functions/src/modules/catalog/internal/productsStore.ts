import admin from "firebase-admin";
import { TProduct } from "@jsdev_ninja/core";
import { productPath } from "./paths";

const db = () => admin.firestore();

/**
 * Remove all undefined fields from an object, recursively.
 * Matches the client-side removeUndefinedFields behaviour (strips undefined,
 * preserves null, recurses into arrays and plain objects).
 */
function removeUndefinedFields<T>(obj: T): T {
	if (obj === null || obj === undefined) return obj;

	if (Array.isArray(obj)) {
		return obj.map(removeUndefinedFields) as unknown as T;
	}

	if (typeof obj === "object" && obj.constructor === Object) {
		const result: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
			if (value !== undefined) {
				result[key] = removeUndefinedFields(value);
			}
		}
		return result as T;
	}

	return obj;
}

/**
 * Upsert a product doc using Firestore merge-set semantics — matching the client's
 * `setDoc(ref, doc, { merge: true })` call in FirebaseApi.firestore.setV2.
 *
 * Undefined fields are stripped before write (matching the client's
 * removeUndefinedFields() call on the payload).
 *
 * Merge means: fields present in the payload are written; fields absent from the
 * payload are left as-is on existing docs. For a new product this is equivalent
 * to a plain create.
 */
export async function upsertProductDoc(product: TProduct): Promise<void> {
	const ref = db().doc(productPath(product.companyId, product.storeId, product.id));
	await ref.set(removeUndefinedFields(product), { merge: true });
}

/**
 * Delete a product doc by id.
 * Returns false if the doc didn't exist (idempotent — callers decide whether to surface).
 *
 * NOTE: image removal from Firebase Storage is intentionally NOT handled here.
 * The client performs Storage cleanup independently (same as current client-side flow).
 */
export async function deleteProductDoc(
	companyId: string,
	storeId: string,
	productId: string,
): Promise<{ existed: boolean }> {
	const ref = db().doc(productPath(companyId, storeId, productId));
	const snap = await ref.get();
	if (!snap.exists) return { existed: false };
	await ref.delete();
	return { existed: true };
}
