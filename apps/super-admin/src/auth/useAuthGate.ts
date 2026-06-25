import { useCallback } from "react";
import { Auth } from "src/lib/firebase/auth";
import { useSuperAdminClaim } from "./useSuperAdminClaim";

export function useAuthGate() {
	const { user, isSuperAdmin, loading } = useSuperAdminClaim();

	const handleSignOut = useCallback(async () => {
		await Auth.signOut();
	}, []);

	return { user, isSuperAdmin, loading, handleSignOut };
}
