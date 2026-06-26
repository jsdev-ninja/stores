/**
 * saListDocuments — list document ids in a Firestore collection, cursor-paginated.
 *
 * Input: ListDocumentsReq { collectionPath: string; limit?: number; cursor?: string | null }
 *   - collectionPath must be an odd-segment collection path (e.g. "company1/store1/orders").
 *   - limit: 1–100, default 50.
 *   - cursor: last doc id from the previous page (accepts null — callable SDK serializes undefined→null).
 *
 * Returns: Result<ListDocumentsRes> — doc ids + optional nextCursor.
 *
 * Security: superAdmin claim required + assertPathAllowed() blocks `private` segments.
 */
import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";
import { verifySuperAdmin } from "../internal/verifySuperAdmin";
import { assertPathAllowed } from "../internal/assertPathAllowed";
import { listDocuments } from "../internal/firestoreBrowserStore";
import { ListDocumentsReqSchema } from "../contracts";
import type { Result, ListDocumentsRes } from "../contracts";

export const saListDocuments = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request): Promise<Result<ListDocumentsRes>> => {
		const auth = verifySuperAdmin(request.auth);
		if (!auth.success) {
			return { success: false, error: auth.error };
		}

		const parsed = ListDocumentsReqSchema.safeParse(request.data);
		if (!parsed.success) {
			logger.warn("superAdmin.saListDocuments: invalid input", {
				uid: auth.uid,
				issues: parsed.error.issues,
			});
			return { success: false, error: "invalid_input" };
		}

		const pathError = assertPathAllowed(parsed.data.collectionPath, "listDocuments");
		if (pathError) {
			logger.warn("superAdmin.saListDocuments: path blocked", {
				uid: auth.uid,
				collectionPath: parsed.data.collectionPath,
				reason: pathError,
			});
			return { success: false, error: pathError };
		}

		try {
			const result = await listDocuments(
				parsed.data.collectionPath,
				parsed.data.limit,
				parsed.data.cursor,
			);
			logger.info("superAdmin.saListDocuments: ok", {
				uid: auth.uid,
				collectionPath: parsed.data.collectionPath,
				count: result.docs.length,
			});
			return { success: true, data: result, nextCursor: result.nextCursor };
		} catch (err: unknown) {
			logger.error("superAdmin.saListDocuments: internal error", {
				uid: auth.uid,
				collectionPath: parsed.data.collectionPath,
				err: err instanceof Error ? err.message : String(err),
			});
			return { success: false, error: "internal" };
		}
	},
);
