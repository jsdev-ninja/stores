import * as functionsV2 from "firebase-functions/v2";
import admin from "firebase-admin";
import { TOrganizationAction } from "../services/organizationActionsService";

export const getOrganizationActions = functionsV2.https.onCall(async (opts) => {
	const auth = opts.auth;
	if (!auth?.token?.admin) {
		throw new functionsV2.https.HttpsError("permission-denied", "Admin only");
	}

	const { organizationId, billingAccountId } = opts.data as {
		organizationId: string;
		billingAccountId?: string;
	};

	if (!organizationId) {
		throw new functionsV2.https.HttpsError("invalid-argument", "organizationId required");
	}

	const db = admin.firestore();
	let query: admin.firestore.Query = db
		.collection(`organizations/${organizationId}/actions`)
		.orderBy("date", "desc")
		.limit(100);

	if (billingAccountId) {
		query = query.where("billingAccountId", "==", billingAccountId);
	}

	const snap = await query.get();
	const actions: TOrganizationAction[] = snap.docs.map((d) => d.data() as TOrganizationAction);

	return { success: true, data: actions };
});
