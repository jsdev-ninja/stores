import { consumePaymentLink } from "../internal/paymentLinksStore";
import { PaymentLink } from "../types";

export type ValidateAndConsumeLinkResult =
	| { success: true; link: PaymentLink }
	| {
			success: false;
			reason: "not_found" | "expired" | "already_used" | "consume_failed";
	  };

/**
 * Validate and atomically consume a payment link (single-use enforcement).
 *
 * All validity checks (expiry + usedAt) run INSIDE the Firestore transaction
 * in consumePaymentLink — no stale-snapshot race condition.
 */
export async function validateAndConsumeLink(
	token: string,
): Promise<ValidateAndConsumeLinkResult> {
	const result = await consumePaymentLink(token);

	if (result.consumed) {
		return { success: true, link: result.link };
	}

	return { success: false, reason: result.reason };
}
