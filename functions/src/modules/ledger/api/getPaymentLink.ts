import * as functions from "firebase-functions/v1";
import { logger } from "firebase-functions/v2";
import { z } from "zod";
import { getPaymentLinkByToken } from "../internal/paymentLinksStore";
import { sanitizeFormFields } from "../internal/sanitizeFormFields";

const TOKEN_REGEX = /^[A-Za-z0-9_-]{16}$/;

const InputSchema = z.object({
	token: z.string().regex(TOKEN_REGEX, "Invalid token format"),
});

/**
 * Public callable — the customer's browser has ONLY the token; no tenant context.
 * Looks up the PaymentLink via collectionGroup, validates state, and returns
 * only { formAction, formFields } — never orderId, companyId, or secrets
 * beyond what HYP needs.
 */
export const getPaymentLink = functions.https.onCall(
	async (data: unknown) => {
		try {
			const parsed = InputSchema.safeParse(data);
			if (!parsed.success) {
				return { success: false, error: "not_found" };
			}

			const { token } = parsed.data;

			const link = await getPaymentLinkByToken(token);

			if (!link) {
				return { success: false, error: "not_found" };
			}

			if (link.expiresAt < Date.now()) {
				return { success: false, error: "expired" };
			}

			if (link.usedAt !== null) {
				return { success: false, error: "already_used" };
			}

			return {
				success: true,
				formAction: link.formAction,
				// Denylist strips any accidental credential echoing from HYP.
				// See sanitizeFormFields above for full rationale.
				formFields: sanitizeFormFields(link.formFields),
			};
		} catch (err: unknown) {
			logger.error("ledger.getPaymentLink.error", { err });
			return { success: false, error: "not_found" };
		}
	},
);
