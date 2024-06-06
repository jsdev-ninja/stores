import admin from "firebase-admin";
import { initializeApp } from "firebase-admin/app";

import A from "./_secrets/opal-market-dev-firebase-adminsdk-c1buw-176855c49a.json" assert { type: "json" };

export const app = initializeApp({
	credential: admin.credential.cert(A),
	storageBucket: "opal-market-dev.appspot.com",
});
