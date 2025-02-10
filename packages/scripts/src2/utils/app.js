import admin from "firebase-admin";
import { initializeApp } from "firebase-admin/app";

import A from "./_secrets/serviceAccount.json" assert { type: "json" };

export const app = initializeApp({
	credential: admin.credential.cert(A),
	storageBucket: "jsdev-stores-prod.appspot.com",
});

export { admin };
