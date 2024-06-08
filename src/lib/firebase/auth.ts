import { createUserWithEmailAndPassword, signInWithEmailAndPassword, getAuth } from "firebase/auth";
import { app } from "./app";

const auth = getAuth(app);

export const Auth = {
	createUser: async (email: string, password: string) => {
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			console.log("userCredential", userCredential);

			return { success: true, user: userCredential.user };
		} catch (error) {
			console.error("auth.createUser", error);
			return { success: false, user: null };
		}
	},
	login: async (email: string, password: string) => {
		try {
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			console.log("userCredential", userCredential);

			return { success: true, user: userCredential.user };
		} catch (error) {
			console.error("auth.createUser", error);
			return { success: false, user: null };
		}
	},
};
