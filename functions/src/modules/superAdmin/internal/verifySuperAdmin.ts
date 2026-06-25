/**
 * Single source of the superAdmin claim check.
 *
 * This helper MUST be called as the first statement in every superAdmin
 * callable — reads AND writes alike. It is the entire basis of this feature's
 * security model (see architecture Section 8).
 *
 * The check is EXCLUSIVELY on auth.token.superAdmin === true.
 * It does NOT fall back to `admin`, store membership, or any other claim.
 * A normal store admin's token or a forged token cannot pass this guard.
 */
import { logger } from "firebase-functions/v2";
import type { SuperAdminError } from "../contracts";

type AuthContext = {
	uid: string;
	token: Record<string, unknown>;
} | null | undefined;

type VerifySuccess = { success: true; uid: string; email: string | null };
type VerifyFailure = { success: false; error: SuperAdminError };

export function verifySuperAdmin(auth: AuthContext): VerifySuccess | VerifyFailure {
	if (!auth) {
		logger.warn("superAdmin.verifySuperAdmin: no auth context");
		return { success: false, error: "unauthorized" };
	}

	// Exclusively check the superAdmin claim — never fall back to admin or
	// any other claim. This is intentional and non-negotiable (architecture §8).
	if (auth.token.superAdmin !== true) {
		logger.warn("superAdmin.verifySuperAdmin: missing or false superAdmin claim", {
			uid: auth.uid,
			hasSuperAdmin: auth.token.superAdmin,
		});
		return { success: false, error: "unauthorized" };
	}

	const email = typeof auth.token.email === "string" ? auth.token.email : null;

	return { success: true, uid: auth.uid, email };
}
