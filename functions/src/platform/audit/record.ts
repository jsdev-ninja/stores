import admin from "firebase-admin";
import diff from "microdiff";
import { AuditEntry, AuditEntrySchema } from "./types";
import { TargetType } from "./types";

export function record(
	tx: FirebaseFirestore.Transaction,
	params: {
		eventType: string;
		actorId: string;
		targetType: TargetType;
		targetId: string;
		before?: unknown;
		after?: unknown;
		summary?: string;
		companyId: string;
		storeId: string;
		metadata?: {
			ip?: string;
			userAgent?: string;
		};
		correlationId?: string;
	},
): AuditEntry {
	const db = admin.firestore();
	const path = `${params.companyId}/${params.storeId}/audit_log`;
	const ref = db.collection(path).doc();

	const entry: AuditEntry = {
		id: ref.id,
		eventType: params.eventType,
		actorId: params.actorId,
		targetType: params.targetType,
		targetId: params.targetId,
		diff:
			params.before !== undefined && params.after !== undefined
				? diff(
						params.before as Record<string, unknown>,
						params.after as Record<string, unknown>,
					)
				: undefined,
		summary: params.summary,
		companyId: params.companyId,
		storeId: params.storeId,
		createdAt: Date.now(),
		metadata: params.metadata,
		correlationId: params.correlationId,
	};

	// Validate before writing. Throws ZodError on invalid input.
	AuditEntrySchema.parse(entry);

	tx.set(ref, entry);
	return entry;
}
