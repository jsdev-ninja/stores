import type { ReactNode } from "react";
import { Button } from "@heroui/react";
import { useAuthGate } from "./useAuthGate";
import { SignInPage } from "./SignInPage";

type Props = {
	children: ReactNode;
};

/**
 * Root auth boundary for the super-admin console.
 *
 * Three states:
 *   1. Loading — blank screen while Firebase resolves the auth state.
 *   2. No user — renders SignInPage.
 *   3. User present but !isSuperAdmin — renders access-denied with sign-out.
 *   4. isSuperAdmin — renders children.
 *
 * The client gate is UX only (see architecture §2). The real enforcement
 * is the server-side superAdmin check on every callable.
 *
 * Export this component; F3 will mount it in App.tsx.
 */
export function AuthGate({ children }: Props) {
	const { user, isSuperAdmin, loading, handleSignOut } = useAuthGate();

	if (loading) {
		return (
			<div className="min-h-screen bg-slate-100 flex items-center justify-center">
				<div className="h-8 w-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
			</div>
		);
	}

	if (!user) {
		return <SignInPage />;
	}

	if (!isSuperAdmin) {
		return (
			<div className="min-h-screen bg-slate-100 flex items-center justify-center">
				<div className="bg-white rounded-xl shadow-sm border border-red-200 p-10 text-center max-w-md w-full">
					<p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-3">
						Access Denied
					</p>
					<h1 className="text-2xl font-bold text-slate-900 mb-2">
						Not Authorized
					</h1>
					<p className="text-sm text-slate-500 mb-8">
						This account does not have super-admin access. Contact
						the developer to have the <code>superAdmin</code> claim
						granted.
					</p>
					<Button fullWidth variant="secondary" onPress={handleSignOut}>
						Sign out
					</Button>
				</div>
			</div>
		);
	}

	return <>{children}</>;
}
