import { getFirestore } from "firebase-admin/firestore";
import { app } from "./app.js";

export const firestoreDB = getFirestore(app);
