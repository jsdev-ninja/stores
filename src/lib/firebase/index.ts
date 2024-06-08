import { firestore } from "./firestore";
import { firebaseStorage } from "./storage";
import { Auth } from "./auth";

export const FirebaseApi = {
	firestore: firestore,
	storage: firebaseStorage,
	auth: Auth,
};
