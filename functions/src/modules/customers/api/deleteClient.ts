import admin from "firebase-admin";
import * as functionsV2 from "firebase-functions/v2";
import { logger } from "firebase-functions/v2";
import { z } from "zod";
import { FirebaseAPI, TProfile } from "@jsdev_ninja/core";

const InputSchema = z.object({
	/** Profile doc id — equals the Firebase Auth uid for registered users. */
	clientId: z.string().min(1),
});

/**
 * Admin: fully delete a client.
 *
 * Auth: requires the `admin` custom claim.
 * Tenant: companyId + storeId come from the auth token — never from client input.
 *
 * Deletes, in order:
 *   1. The tenant-scoped profile doc (`{companyId}/{storeId}/profiles/{clientId}`).
 *      Organization membership lives only on the profile (`organizationIds[]` /
 *      legacy `organizationId`) — there is no reverse member list on the
 *      organization doc, so removing the profile also removes the membership.
 *   2. The Firebase Auth user. `auth/user-not-found` is swallowed so anonymous /
 *      legacy profiles that never had an auth account still delete cleanly.
 *
 * Orders, invoices, receipts and payments are intentionally left untouched —
 * they snapshot their own data and only *reference* the clientId.
 */
export const deleteClient = functionsV2.https.onCall(
	{ memory: "256MiB", invoker: "public" },
	async (request) => {
		const { auth, data } = request;

		if (!auth?.token.admin) {
			return { success: false as const, error: "Unauthorized" };
		}

		const companyId = auth.token.companyId as string | undefined;
		const storeId = auth.token.storeId as string | undefined;

		if (!companyId || !storeId) {
			logger.error("customers.deleteClient.missingTokenClaims", { uid: auth.uid });
			return { success: false as const, error: "missing_token_claims" };
		}

		const parsed = InputSchema.safeParse(data);
		if (!parsed.success) {
			logger.error("customers.deleteClient.invalidInput", {
				uid: auth.uid,
				issues: parsed.error.issues,
			});
			return { success: false as const, error: "invalid_input" };
		}

		const { clientId } = parsed.data;
		const db = admin.firestore();

		const profilesPath = FirebaseAPI.firestore.getPath({
			collectionName: "profiles",
			companyId,
			storeId,
		});

		// Verify the profile exists and belongs to the caller's tenant before
		// touching anything — prevents an admin of store A deleting store B's user.
		const profileRef = db.collection(profilesPath).doc(clientId);
		const profileSnap = await profileRef.get();

		if (!profileSnap.exists) {
			return { success: false as const, error: "profile_not_found" };
		}

		const profile = profileSnap.data() as TProfile;
		if (profile.storeId !== storeId || profile.companyId !== companyId) {
			logger.error("customers.deleteClient.tenantMismatch", {
				uid: auth.uid,
				clientId,
				profileStoreId: profile.storeId,
				profileCompanyId: profile.companyId,
			});
			return { success: false as const, error: "tenant_mismatch" };
		}

		// 1) Profile doc (also removes org membership — it lives on the profile).
		await profileRef.delete();

		// 2) Firebase Auth user. Missing account is fine (anonymous / legacy).
		let authDeleted = false;
		try {
			await admin.auth().deleteUser(clientId);
			authDeleted = true;
		} catch (err) {
			const code = (err as { code?: string }).code;
			if (code === "auth/user-not-found") {
				logger.info("customers.deleteClient.authUserNotFound", { clientId });
			} else {
				logger.error("customers.deleteClient.authDeleteFailed", { clientId, code, err });
				return { success: false as const, error: "auth_delete_failed" };
			}
		}

		logger.info("customers.deleteClient.done", {
			uid: auth.uid,
			clientId,
			companyId,
			storeId,
			authDeleted,
		});

		return { success: true as const, authDeleted };
	},
);
