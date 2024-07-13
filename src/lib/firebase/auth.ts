import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	getAuth,
	onAuthStateChanged,
	User,
	signOut,
	signInAnonymously,
	EmailAuthProvider,
	linkWithCredential,
} from "firebase/auth";
import { app } from "./app";

const auth = getAuth(app);

export const Auth = {
	auth: auth,
	setTenantId: (tenantId: string) => {
		auth.tenantId = tenantId;
	},
	createUser: async (email: string, password: string) => {
		try {
			if (auth.currentUser && auth.currentUser.isAnonymous) {
				const credential = EmailAuthProvider.credential(email, password);
				const response = await linkWithCredential(auth.currentUser, credential);
				return { success: true, user: response.user, error: null };
			}
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
