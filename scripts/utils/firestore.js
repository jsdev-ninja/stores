import admin from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import A from "./_secrets/opal-market-dev-firebase-adminsdk-c1buw-176855c49a.json" assert { type: "json" };

const app = initializeApp({
	credential: admin.credential.cert(A),
});

export const firestoreDB = getFirestore(app);
