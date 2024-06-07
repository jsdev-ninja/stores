/* eslint-disable @typescript-eslint/no-explicit-any */
import { addDoc, collection, doc, getDoc, getDocs, getFirestore, query } from "firebase/firestore";
import { app } from "./app";

const db = getFirestore(app);

async function create(item: any, coll: any) {
	try {
		const docRef = await addDoc(collection(db, coll), item);

		const data = { ...item, id: docRef.id };

		return { success: true, data };
	} catch (error) {
		console.error(error);
		return { success: false };
	}
}

async function get(id: string, coll: string) {
	try {
		const q = doc(db, coll, id);

		const querySnapshot = await getDoc(q);

		if (!querySnapshot.exists()) {
			return { success: true, data: null };
		}

		const result = { ...querySnapshot.data(), id: querySnapshot.id };

		return { success: true, data: result };
	} catch (error) {
		console.error(error);
		return { success: false };
	}
}

async function list(coll: any) {
	try {
		const q = query(collection(db, coll));

		const result: any = [];
		const querySnapshot = await getDocs(q);
		querySnapshot.forEach((doc) => {
			// doc.data() is never undefined for query doc snapshots
			result.push({
				id: doc.id,
				...doc.data(),
			});
		});

		return { success: true, data: result };
	} catch (error) {
		console.error(error);
		return { success: false };
	}
}

const collections = {
	products: "products",
	categories: "categories",
};
export const firestore = { create, list, collections, get };
