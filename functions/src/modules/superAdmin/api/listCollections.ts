/**
 * saListCollections — list child collection ids under a Firestore path.
 *
 * Input: ListCollectionsReq { path?: string }
 *   - Empty / omitted path → root collections.
 *   - Non-empty path must be an even-segment doc path (e.g. "STORES/abc").
 *
 * Returns: Result<ListCollectionsRes> — sorted collection ids, `private` filtered out.
 *
 * Security: superAdmin claim required + assertPathAllowed() blocks `private` segments.
 */
import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";
import { verifySuperAdmin } from "../internal/verifySuperAdmin";
import { assertPathAllowed } from "../internal/assertPathAllowed";
import { listCollections } from "../internal/firestoreBrowserStore";
import { ListCollectionsReqSchema } from "../contracts";
import type { Result, ListCollectionsRes } from "../contracts";

export const saListCollections = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request): Promise<Result<ListCollectionsRes>> => {
		const auth = verifySuperAdmin(request.auth);
		if (!auth.success) {
			return { success: false, error: auth.error };
		}

		const parsed = ListCollectionsReqSchema.safeParse(request.data);
		if (!parsed.success) {
			logger.warn("superAdmin.saListCollections: invalid input", {
				uid: auth.uid,
				issues: parsed.error.issues,
			});
			return { success: false, error: "invalid_input" };
		}

		const pathError = assertPathAllowed(parsed.data.path, "listCollections");
		if (pathError) {
			logger.warn("superAdmin.saListCollections: path blocked", {
				uid: auth.uid,
				path: parsed.data.path,
				reason: pathError,
			});
			return { success: false, error: pathError };
		}

		try {
			const collections = await listCollections(parsed.data.path);
			logger.info("superAdmin.saListCollections: ok", {
				uid: auth.uid,
				path: parsed.data.path ?? "(root)",
				count: collections.length,
			});
			return { success: true, data: { collections } };
		} catch (err: unknown) {
			logger.error("superAdmin.saListCollections: internal error", {
				uid: auth.uid,
				path: parsed.data.path,
				err: err instanceof Error ? err.message : String(err),
			});
			return { success: false, error: "internal" };
		}
	},
);
