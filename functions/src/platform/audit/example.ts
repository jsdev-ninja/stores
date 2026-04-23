import admin from "firebase-admin";
import { emit } from "../eventBus";
import { record } from "./index";

// ──────────────────────────────────────────────────────────────
// 1. Record a change inside the same transaction as the state write.
//    Keeps the audit entry atomic with the actual change — either
//    both commit or neither.
// ──────────────────────────────────────────────────────────────

async function exampleChangeOrderStatus(
	orderRef: FirebaseFirestore.DocumentReference,
	input: {
		companyId: string;
		storeId: string;
		userId: string;
		newStatus: "pending" | "paid" | "cancelled";
	},
) {
	const db = admin.firestore();

	await db.runTransaction(async (tx) => {
		const snap = await tx.get(orderRef);
		const before = snap.data();

		tx.update(orderRef, { status: input.newStatus });

		const after = { ...before, status: input.newStatus };

		record(tx, {
			eventType: "order.status_changed",
			actorId: `user:${input.userId}`,
			targetType: "orders",
			targetId: orderRef.id,
			before,
			after,
			summary: `status: ${before?.status} → ${input.newStatus}`,
			companyId: input.companyId,
			storeId: input.storeId,
		});
	});
}

// ──────────────────────────────────────────────────────────────
// 2. Combined emit + audit in the same transaction.
//    Chain correlationId from the emitted event into the audit
//    entry — both are now queryable via correlationId.
// ──────────────────────────────────────────────────────────────

async function exampleChangeOrderStatusWithAudit(
	orderRef: FirebaseFirestore.DocumentReference,
	input: {
		companyId: string;
		storeId: string;
		userId: string;
		newStatus: "pending" | "paid" | "cancelled";
	},
) {
	const db = admin.firestore();

	await db.runTransaction(async (tx) => {
		const snap = await tx.get(orderRef);
		const before = snap.data();

		tx.update(orderRef, { status: input.newStatus });
		const after = { ...before, status: input.newStatus };

		// emit returns the full StoredEvent — capture it to chain correlationId.
		const emitted = emit(tx, {
			type: "order.status_changed",
			payload: { orderId: orderRef.id, newStatus: input.newStatus },
			companyId: input.companyId,
			storeId: input.storeId,
			actorId: `user:${input.userId}`,
			source: "orders",
		});

		record(tx, {
			eventType: emitted.type,
			correlationId: emitted.correlationId,
			actorId: `user:${input.userId}`,
			targetType: "orders",
			targetId: orderRef.id,
			before,
			after,
			summary: `status: ${before?.status} → ${input.newStatus}`,
			companyId: input.companyId,
			storeId: input.storeId,
		});
	});
}

// Prevent "unused" warnings — this file is reference-only.
export const _example = {
	exampleChangeOrderStatus,
	exampleChangeOrderStatusWithAudit,
};
