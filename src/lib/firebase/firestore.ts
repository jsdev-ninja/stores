import { addDoc, collection, getFirestore } from "firebase/firestore";
import { app } from "./app";

const db = getFirestore(app);

async function create(item, coll) {
	try {
		const docRef = await addDoc(collection(db, coll), item);

		const data = { ...item, id: docRef.id };

		return { success: true, data };
	} catch (error) {
		console.error(error);
		return { success: false };
	}
}

const collections = {
	products: "products",
};
export const firestore = { create, collections };
