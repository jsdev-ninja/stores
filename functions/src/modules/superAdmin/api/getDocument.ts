/**
 * saGetDocument — fetch a single Firestore document by raw path.
 *
 * Input: GetDocumentReq { path: string }
 *   - path must be an even-segment doc path (e.g. "STORES/abc", "company1/store1/orders/o1").
 *
 * Returns: Result<GetDocumentRes> — { id, data } where data is null if the doc is absent.
 *
 * Security: superAdmin claim required + assertPathAllowed() blocks `private` segments.
 */
import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";
import { verifySuperAdmin } from "../internal/verifySuperAdmin";
import { assertPathAllowed } from "../internal/assertPathAllowed";
import { getDocument } from "../internal/firestoreBrowserStore";
import { GetDocumentReqSchema } from "../contracts";
import type { Result, GetDocumentRes } from "../contracts";

export const saGetDocument = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request): Promise<Result<GetDocumentRes>> => {
		const auth = verifySuperAdmin(request.auth);
		if (!auth.success) {
			return { success: false, error: auth.error };
		}

		const parsed = GetDocumentReqSchema.safeParse(request.data);
		if (!parsed.success) {
			logger.warn("superAdmin.saGetDocument: invalid input", {
				uid: auth.uid,
				issues: parsed.error.issues,
			});
			return { success: false, error: "invalid_input" };
		}

		const pathError = assertPathAllowed(parsed.data.path, "getDocument");
		if (pathError) {
			logger.warn("superAdmin.saGetDocument: path blocked", {
				uid: auth.uid,
				path: parsed.data.path,
				reason: pathError,
			});
			return { success: false, error: pathError };
		}

		try {
			const result = await getDocument(parsed.data.path);
			logger.info("superAdmin.saGetDocument: ok", {
				uid: auth.uid,
				path: parsed.data.path,
				exists: result.data !== null,
			});
			return { success: true, data: result };
		} catch (err: unknown) {
			logger.error("superAdmin.saGetDocument: internal error", {
				uid: auth.uid,
				path: parsed.data.path,
				err: err instanceof Error ? err.message : String(err),
			});
			return { success: false, error: "internal" };
		}
	},
);
