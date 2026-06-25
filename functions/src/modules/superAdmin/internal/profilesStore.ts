/**
 * profilesStore — Firestore access layer for profiles in the superAdmin module.
 *
 * All queries are tenant-scoped via paths.ts (getPath). Cursor pagination
 * uses the last document id as an opaque cursor.
 */
import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import type { TProfile } from "@jsdev_ninja/core";
import type { ProfileListRow, ListReq, GetReq, SearchProfilesReq } from "../contracts";
import { profilesCollectionPath, profileDocPath } from "./paths";

const db = () => admin.firestore();

/** Project a full profile doc to the lean list row shape. */
function toListRow(id: string, data: TProfile): ProfileListRow {
	return {
		id,
		displayName: data.displayName ?? "",
		email: data.email ?? "",
		phoneNumber: data.phoneNumber ?? null,
	};
}

/**
 * List profiles for a tenant, paginated.
 * Returns rows + optional nextCursor (last doc id of this page).
 */
export async function listProfiles(
	req: ListReq,
): Promise<{ rows: ProfileListRow[]; nextCursor: string | undefined }> {
	const { companyId, storeId, limit, cursor } = req;
	const collPath = profilesCollectionPath(companyId, storeId);

	let query = db()
		.collection(collPath)
		.orderBy("createdDate", "desc")
		.limit(limit);

	if (cursor) {
		const cursorDoc = await db().doc(`${collPath}/${cursor}`).get();
		if (cursorDoc.exists) {
			query = query.startAfter(cursorDoc);
		} else {
			logger.warn("superAdmin.profilesStore.listProfiles: cursor doc not found", {
				companyId,
				storeId,
				cursor,
			});
		}
	}

	const snap = await query.get();
	const rows = snap.docs.map((doc) => toListRow(doc.id, doc.data() as TProfile));
	const nextCursor = snap.docs.length === limit ? snap.docs[snap.docs.length - 1].id : undefined;

	return { rows, nextCursor };
}

/**
 * Get a single profile by id, tenant-scoped.
 * Returns the full TProfile doc or null if absent.
 */
export async function getProfile(req: GetReq): Promise<TProfile | null> {
	const { companyId, storeId, id } = req;
	const docRef = db().doc(profileDocPath(companyId, storeId, id));
	const snap = await docRef.get();

	if (!snap.exists) {
		return null;
	}

	return { id: snap.id, ...snap.data() } as TProfile;
}

/**
 * Search profiles by exact email or exact phoneNumber, tenant-scoped.
 *
 * NOTE for B4: byEmail requires an index on email (ASC) within the
 * tenant-scoped profiles collection. byPhone requires an index on
 * phoneNumber (ASC). Both are single-field equality queries — Firestore
 * auto-indexes single fields, so no explicit composite index is required.
 */
export async function searchProfiles(
	req: SearchProfilesReq,
): Promise<{ rows: ProfileListRow[]; nextCursor: string | undefined }> {
	const { companyId, storeId, byEmail, byPhone } = req;
	const collPath = profilesCollectionPath(companyId, storeId);

	if (byEmail) {
		const snap = await db()
			.collection(collPath)
			.where("email", "==", byEmail)
			.limit(10)
			.get();

		const rows = snap.docs.map((doc) => toListRow(doc.id, doc.data() as TProfile));
		return { rows, nextCursor: undefined };
	}

	// byPhone exact match
	const snap = await db()
		.collection(collPath)
		.where("phoneNumber", "==", byPhone)
		.limit(10)
		.get();

	const rows = snap.docs.map((doc) => toListRow(doc.id, doc.data() as TProfile));
	return { rows, nextCursor: undefined };
}
