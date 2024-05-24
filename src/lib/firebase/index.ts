import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { app } from "./app";
import { firestore } from "./firestore";

const auth = getAuth(app);

export const FirebaseApi = {
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
	firestore: firestore,
};
