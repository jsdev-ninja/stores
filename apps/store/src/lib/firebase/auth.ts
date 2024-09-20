import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	getAuth,
	onAuthStateChanged,
	signOut,
	signInAnonymously,
	EmailAuthProvider,
	linkWithCredential,
} from "firebase/auth";
import { app } from "./app";
import { TUser, Token } from "src/types";

const auth = getAuth(app);

export const Auth = {
	auth: auth,
	getClaims: async () => {
		const idTokenResult = await auth.currentUser?.getIdTokenResult();
		return idTokenResult?.claims as Token;
	},
	setTenantId: (tenantId: string) => {
		auth.tenantId = tenantId;
	},
	createUser: async (email: string, password: string) => {
		try {
			if (auth.currentUser && auth.currentUser.isAnonymous) {
				const credential = EmailAuthProvider.credential(email, password);
				const response = await linkWithCredential(auth.currentUser, credential);
				return { success: true, user: response.user as TUser, error: null };
			}
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);

			return { success: true, user: userCredential.user as TUser, error: null };
		} catch (error) {
			console.error("auth.createUser", error);
			return { success: false, user: null, error };
		}
	},
	login: async (email: string, password: string) => {
		try {
			// EmailAuthProvider.credential()
			const userCredential = await signInWithEmailAndPassword(auth, email, password);

			const claims = await Auth.getClaims();

			let newUser = Object.create(
				Object.getPrototypeOf(userCredential.user),
				Object.getOwnPropertyDescriptors(userCredential.user)
			);
			newUser = Object.assign(newUser, claims);

			return { success: true, user: newUser as TUser };
		} catch (error: any) {
			console.error("auth.createUser", error);

			return { success: false, user: null, error };
		}
	},
	logout: async () => {
		try {
			await signOut(auth);

			return { success: true };
		} catch (error) {
			console.error("auth.logout", error);
			return { success: false, user: null };
		}
	},
	signInAnonymously: async () => {
		const user = await signInAnonymously(auth);
		return user;
	},
	onUser: (callback: (user: TUser | null) => void) => {
		const unSubscribe = onAuthStateChanged(auth, async (user) => {
			if (user && !user.isAnonymous) {
				const claims = await Auth.getClaims();

				let newUser = Object.create(
					Object.getPrototypeOf(user),
					Object.getOwnPropertyDescriptors(user)
				);
				newUser = Object.assign(newUser, claims);

				return callback?.(newUser);
			}
			callback?.(user as TUser);
		});
		return unSubscribe;
	},
};
