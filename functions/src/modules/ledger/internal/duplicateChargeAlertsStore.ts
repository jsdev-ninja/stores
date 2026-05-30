import admin from "firebase-admin";
import { DuplicateChargeAlert } from "../types";
import { duplicateChargeAlertDocPath } from "./paths";

const db = () => admin.firestore();

/**
 * Write (or merge) a DuplicateChargeAlert.
 * Alert id is deterministic: `dup_{orderId}` — idempotent per order.
 */
export async function writeDuplicateChargeAlert(
	alert: DuplicateChargeAlert,
): Promise<void> {
	const alertId = `dup_${alert.orderId}`;
	await db()
		.doc(
			duplicateChargeAlertDocPath(
				alert.companyId,
				alert.storeId,
				alertId,
			),
		)
		.set(alert, { merge: true });
}
