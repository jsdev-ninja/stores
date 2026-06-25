import {
	getAuth,
	signInWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { app } from "./app";

// No tenant id is set on this auth instance — the super-admin is not a
// tenant member. This mirrors apps/store/src/lib/firebase/auth.ts but
// removes all tenant / anonymous / link-credential flows that are
// irrelevant to the super-admin console.

const auth = getAuth(app);

export type IdTokenClaims = {
	superAdmin?: boolean;
	admin?: boolean;
	[key: string]: unknown;
};

export const Auth = {
	auth,

	getClaims: async (): Promise<IdTokenClaims> => {
		const result = await auth.currentUser?.getIdTokenResult();
		return (result?.claims ?? {}) as IdTokenClaims;
	},

	signIn: async (email: string, password: string) => {
		const credential = await signInWithEmailAndPassword(auth, email, password);
		const claims = await Auth.getClaims();
		return { user: credential.user, claims };
	},

	signOut: async () => {
		await signOut(auth);
	},

	onUser: (callback: (user: User | null) => void) => {
		return onAuthStateChanged(auth, callback);
	},
};
