import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import {
	budgetAccountShadowPath,
	budgetTransactionsShadowCollectionPath,
	budgetRollupShadowPath,
	budgetIdempotencyShadowPath,
} from "./shadowPaths";

function currentMonthPeriod(): string {
	const now = new Date();
	const year = now.getUTCFullYear();
	const month = String(now.getUTCMonth() + 1).padStart(2, "0");
	return `${year}-${month}`;
}

type RollupSpec = {
	id: string;
	granularity: "month" | "lifetime";
	period: string;
	organizationId: string | null;
};

export async function applyShadowTransaction(params: {
	companyId: string;
	storeId: string;
	eventId: string;
	organizationId: string;
	organizationName: string;
	billingAccountId: string | null;
	type: "delivery_note" | "payment_received" | "order_cancelled";
	debt: number;
	orderId: string | null;
	orderTotal: number | null;
	deliveryNoteId: string | null;
	deliveryNoteNumber: string | null;
	paymentReference: string | null;
	paymentDate: number | null;
	paymentMethod: string | null;
	note: string | null;
	createdBy: string;
}): Promise<void> {
	const {
		companyId,
		storeId,
		eventId,
		organizationId,
		organizationName,
		billingAccountId,
		type,
		debt,
		orderId,
		orderTotal,
		deliveryNoteId,
		deliveryNoteNumber,
		paymentReference,
		paymentDate,
		paymentMethod,
		note,
		createdBy,
	} = params;

	const db = admin.firestore();
	const FieldValue = admin.firestore.FieldValue;

	const monthPeriod = currentMonthPeriod();

	const rollups: RollupSpec[] = [
		{ id: `month_${monthPeriod}`,              granularity: "month",    period: monthPeriod,  organizationId: null },
		{ id: `month_${monthPeriod}_org-${organizationId}`, granularity: "month", period: monthPeriod, organizationId },
		{ id: "lifetime",                           granularity: "lifetime", period: "lifetime",   organizationId: null },
		{ id: `lifetime_org-${organizationId}`,    granularity: "lifetime", period: "lifetime",   organizationId },
	];

	const markerRef = db.doc(budgetIdempotencyShadowPath(companyId, storeId, eventId));
	const accountRef = db.doc(budgetAccountShadowPath(companyId, storeId, organizationId));
	const ledgerRef = db.collection(budgetTransactionsShadowCollectionPath(companyId, storeId, organizationId)).doc();
	const rollupRefs = rollups.map((r) => db.doc(budgetRollupShadowPath(companyId, storeId, r.id)));

	await db.runTransaction(async (tx) => {
		// 1. Idempotency check
		const markerSnap = await tx.get(markerRef);
		if (markerSnap.exists) {
			logger.info("budget.shadow.alreadyProcessed", { eventId, companyId, storeId });
			return;
		}

		// 2. Read current account balance for running balance on ledger row
		const accountSnap = await tx.get(accountRef);
		const currentBalance = accountSnap.exists
			? ((accountSnap.data() as { balance?: number })?.balance ?? 0)
			: 0;

		const now = Date.now();
		const runningBalance = currentBalance + debt;

		// 3. Create ledger entry (auto-id doc)
		tx.create(ledgerRef, {
			id: ledgerRef.id,
			organizationId,
			companyId,
			storeId,
			type,
			debt,
			runningBalance,
			orderId,
			orderTotal,
			deliveryNoteId,
			deliveryNoteNumber,
			billingAccountId,
			paymentReference,
			paymentDate,
			paymentMethod,
			note,
			createdBy,
			currency: "ILS",
			createdAt: now,
		});

		// 4. Merge account totals
		tx.set(
			accountRef,
			{
				id: organizationId,
				organizationId,
				organizationName,
				companyId,
				storeId,
				balance: FieldValue.increment(debt),
				totalDebits: FieldValue.increment(debt > 0 ? debt : 0),
				totalCredits: FieldValue.increment(debt < 0 ? -debt : 0),
				currency: "ILS",
				updatedAt: now,
			},
			{ merge: true },
		);

		// 5. Merge each rollup
		for (let i = 0; i < rollups.length; i++) {
			const spec = rollups[i];
			const ref = rollupRefs[i];
			if (!spec || !ref) continue;
			tx.set(
				ref,
				{
					id: spec.id,
					granularity: spec.granularity,
					period: spec.period,
					organizationId: spec.organizationId,
					billingAccountId: null,
					companyId,
					storeId,
					balance: FieldValue.increment(debt),
					totalDebits: FieldValue.increment(debt > 0 ? debt : 0),
					totalCredits: FieldValue.increment(debt < 0 ? -debt : 0),
					currency: "ILS",
					updatedAt: now,
				},
				{ merge: true },
			);
		}

		// 6. Write idempotency marker
		tx.set(markerRef, {
			eventId,
			processedAt: now,
			expiresAt: now + 90 * 24 * 60 * 60 * 1000,
		});
	});

	logger.info("budget.shadow.applied", {
		eventId,
		organizationId,
		type,
		debt,
		companyId,
		storeId,
	});
}
