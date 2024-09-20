import { firestore } from "./firestore";
import { firebaseStorage } from "./storage";
import { Auth } from "./auth";
import { api } from "./api";

export const FirebaseApi = {
	firestore: firestore,
	storage: firebaseStorage,
	auth: Auth,
	api: api,
};
