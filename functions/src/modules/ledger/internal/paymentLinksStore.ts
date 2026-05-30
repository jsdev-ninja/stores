import admin from "firebase-admin";
import { PaymentLink } from "../types";
import { paymentLinkDocPath } from "./paths";

const db = () => admin.firestore();

export async function writePaymentLink(link: PaymentLink): Promise<void> {
	await db()
		.doc(paymentLinkDocPath(link.companyId, link.storeId, link.token))
		.set(link);
}

/**
 * Look up a PaymentLink by token using a collectionGroup query.
 * The data stays tenant-scoped under {cid}/{sid}/paymentLinks/{token};
 * collectionGroup resolves it without knowing the tenant at read time.
 */
export async function getPaymentLinkByToken(
	token: string,
): Promise<PaymentLink | null> {
	const snap = await db()
		.collectionGroup("paymentLinks")
		.where("token", "==", token)
		.limit(1)
		.get();

	if (snap.empty) return null;
	return snap.docs[0]!.data() as PaymentLink;
}

export type ConsumeResult =
	| { consumed: true; link: PaymentLink }
	| {
			consumed: false;
			reason: "not_found" | "expired" | "already_used" | "consume_failed";
	  };

/**
 * Transactionally mark a PaymentLink as used (single-use enforcement).
 *
 * All validity checks (expiry + usedAt) are performed INSIDE the Firestore
 * transaction against the freshly-read snapshot — never against a stale
 * pre-read — so concurrent requests cannot both succeed.
 */
export async function consumePaymentLink(token: string): Promise<ConsumeResult> {
	// First, resolve the doc path via collectionGroup (no tenant context known)
	const existing = await getPaymentLinkByToken(token);
	if (!existing) return { consumed: false, reason: "not_found" };

	const docRef = db().doc(
		paymentLinkDocPath(existing.companyId, existing.storeId, token),
	);

	let result: ConsumeResult = { consumed: false, reason: "consume_failed" };

	await db().runTransaction(async (txn) => {
		const snap = await txn.get(docRef);
		if (!snap.exists) {
			result = { consumed: false, reason: "not_found" };
			return;
		}

		const data = snap.data() as PaymentLink;

		// Check expiry INSIDE the transaction against the fresh snapshot
		if (data.expiresAt < Date.now()) {
			result = { consumed: false, reason: "expired" };
			return;
		}

		// Check already-used INSIDE the transaction
		if (data.usedAt !== null) {
			result = { consumed: false, reason: "already_used" };
			return;
		}

		txn.update(docRef, { usedAt: Date.now() });
		result = { consumed: true, link: data };
	});

	return result;
}
