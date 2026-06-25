import { useState, useEffect } from "react";
import type { User } from "firebase/auth";
import { Auth } from "src/lib/firebase/auth";
import type { IdTokenClaims } from "src/lib/firebase/auth";

type SuperAdminClaimState = {
	user: User | null;
	claims: IdTokenClaims;
	isSuperAdmin: boolean;
	loading: boolean;
};

export function useSuperAdminClaim(): SuperAdminClaimState {
	const [state, setState] = useState<SuperAdminClaimState>({
		user: null,
		claims: {},
		isSuperAdmin: false,
		loading: true,
	});

	useEffect(() => {
		const unsubscribe = Auth.onUser(async (user) => {
			if (!user) {
				setState({ user: null, claims: {}, isSuperAdmin: false, loading: false });
				return;
			}
			const claims = await Auth.getClaims();
			setState({
				user,
				claims,
				isSuperAdmin: claims.superAdmin === true,
				loading: false,
			});
		});
		return unsubscribe;
	}, []);

	return state;
}
