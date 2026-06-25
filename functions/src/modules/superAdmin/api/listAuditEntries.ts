/**
 * saListAuditEntries — list SUPER_ADMIN_AUDIT records newest-first.
 *
 * Input:  ListAuditReq (optional companyId, storeId, limit, cursor).
 * Returns: Result<AuditEntry[]> with optional nextCursor.
 *
 * No tenant-scope enforcement on input: the audit log is cross-tenant by
 * design (architecture §5). The caller may filter to a specific store/company
 * but is not required to. verifySuperAdmin is still required.
 */
import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";
import { verifySuperAdmin } from "../internal/verifySuperAdmin";
import { listAuditEntries } from "../internal/auditStore";
import { ListAuditReqSchema } from "../contracts";
import type { Result, AuditEntry } from "../contracts";

export const saListAuditEntries = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request): Promise<Result<AuditEntry[]>> => {
		// Auth check FIRST — before any input parsing
		const auth = verifySuperAdmin(request.auth);
		if (!auth.success) {
			return { success: false, error: auth.error };
		}

		const parsed = ListAuditReqSchema.safeParse(request.data);
		if (!parsed.success) {
			logger.warn("superAdmin.saListAuditEntries: invalid input", {
				uid: auth.uid,
				issues: parsed.error.issues,
			});
			return { success: false, error: "invalid_input" };
		}

		try {
			const { rows, nextCursor } = await listAuditEntries(parsed.data);
			logger.info("superAdmin.saListAuditEntries: ok", {
				uid: auth.uid,
				companyId: parsed.data.companyId,
				storeId: parsed.data.storeId,
				count: rows.length,
			});
			return { success: true, data: rows, nextCursor };
		} catch (err: unknown) {
			logger.error("superAdmin.saListAuditEntries: internal error", {
				uid: auth.uid,
				companyId: parsed.data.companyId,
				storeId: parsed.data.storeId,
				err: err instanceof Error ? err.message : String(err),
			});
			return { success: false, error: "internal" };
		}
	},
);
