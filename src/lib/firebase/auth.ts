import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	getAuth,
	onAuthStateChanged,
	User,
	signOut,
	signInAnonymously,
	EmailAuthProvider,
} from "firebase/auth";
import { app } from "./app";
import { FirebaseError } from "firebase/app";

const auth = getAuth(app);
// auth.tenantId = "my-tenant-xqf3p";

export const Auth = {
	createUser: async (email: string, password: string) => {
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);

			return { success: true, user: userCredential.user, error: null };
		} catch (error) {
			console.error("auth.createUser", error);
			return { success: false, user: null, error };
		}
	},
	login: async (email: string, password: string) => {
		try {
			// EmailAuthProvider.credential()
			const userCredential = await signInWithEmailAndPassword(auth, email, password);

			return { success: true, user: userCredential.user };
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
		console.log("signInAnonymously", user);
	},
	onUser: (callback: (user: User | null) => void) => {
		const unSubscribe = onAuthStateChanged(auth, (user) => {
			callback?.(user);
		});
		return unSubscribe;
	},
};
