import * as functions from "firebase-functions/v1";
import { logger } from "firebase-functions/v2";
import { z } from "zod";
import { postTransaction } from "../services/postTransaction";

const InputSchema = z.object({
	/** Integer agorot */
	amount: z.number().int().positive(),
	idempotencyKey: z.string().min(1).max(200),
	reference: z
		.object({
			type: z.enum(["order", "refund", "adjustment"]),
			id: z.string().min(1),
		})
		.optional(),
	payer: z
		.object({
			organizationId: z.string().optional(),
			clientId: z.string().optional(),
			billingAccountId: z.string().optional(),
		})
		.optional(),
});

/**
 * Admin records an external money movement (cash, bank transfer, etc.).
 *
 * Auth: requires `admin` custom claim.
 * Tenant: companyId and storeId are derived exclusively from the auth token
 * claims — never from client-supplied input.
 */
export const postManualTransaction = functions.https.onCall(
	async (data: unknown, context) => {
		try {
			// Require admin custom claim
			if (!context.auth?.token.admin) {
				return { success: false, error: "Unauthorized" };
			}
			const uid = context.auth.uid;

			// Derive tenant from token claims — never trust client input for tenant
			const companyId = context.auth.token.companyId as string | undefined;
			const storeId = context.auth.token.storeId as string | undefined;

			if (!companyId || !storeId) {
				logger.error("ledger.postManualTransaction.missingTokenClaims", {
					uid,
					hasCompanyId: !!companyId,
					hasStoreId: !!storeId,
				});
				return { success: false, error: "missing_token_claims" };
			}

			const parsed = InputSchema.safeParse(data);
			if (!parsed.success) {
				logger.error("ledger.postManualTransaction.invalidInput", {
					uid,
					issues: parsed.error.issues,
				});
				return { success: false, error: "invalid_input" };
			}

			const input = parsed.data;

			const tx = await postTransaction({
				source: "api",
				idempotencyKey: input.idempotencyKey,
				actor: { type: "user", userId: uid },
				type: "manual",
				amount: input.amount,
				currency: "ILS",
				direction: "in",
				reference: input.reference,
				payer: input.payer,
				companyId,
				storeId,
			});

			return { success: true, transactionId: tx.id };
		} catch (err: unknown) {
			logger.error("ledger.postManualTransaction.error", { err });
			return { success: false, error: "internal" };
		}
	},
);
