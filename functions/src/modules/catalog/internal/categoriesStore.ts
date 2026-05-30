import admin from "firebase-admin";
import { TCategory } from "@jsdev_ninja/core";
import { categoriesDocPath } from "./paths";

const db = () => admin.firestore();

type CategoriesDoc = {
	id: "categories";
	categories: TCategory[];
};

/**
 * Atomically append a single category to the categories array.
 *
 * The read, duplicate-id check, and write all happen inside a single Firestore
 * transaction — concurrent appends are therefore safe and neither is lost.
 *
 * Throws if a category with the same id already exists (the caller surfaces this
 * as an HttpsError("already-exists")).
 *
 * Returns the full updated categories array.
 */
export async function appendCategoryDoc(
	companyId: string,
	storeId: string,
	newCategory: TCategory,
): Promise<TCategory[]> {
	const ref = db().doc(categoriesDocPath(companyId, storeId));

	return db().runTransaction(async (txn) => {
		const snap = await txn.get(ref);
		const existing: TCategory[] = snap.exists
			? ((snap.data() as CategoriesDoc | undefined)?.categories ?? [])
			: [];

		const duplicate = existing.find((c) => c.id === newCategory.id);
		if (duplicate) {
			// Signal to the service layer that this is a duplicate
			const err = new Error(`Category id "${newCategory.id}" already exists`);
			(err as NodeJS.ErrnoException).code = "ALREADY_EXISTS";
			throw err;
		}

		const updated = [...existing, newCategory];
		const doc: CategoriesDoc = { id: "categories", categories: updated };
		txn.set(ref, doc);

		return updated;
	});
}

/**
 * Overwrite the entire categories array (plain set — full replacement is inherently atomic).
 */
export async function overwriteCategoriesDoc(companyId: string, storeId: string, categories: TCategory[]): Promise<void> {
	const ref = db().doc(categoriesDocPath(companyId, storeId));
	const doc: CategoriesDoc = { id: "categories", categories };
	await ref.set(doc);
}
