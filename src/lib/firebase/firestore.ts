import { addDoc, collection, getDocs, getFirestore, query } from "firebase/firestore";
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

async function list(coll) {
	try {
		const q = query(collection(db, coll));

		const result = [];
		const querySnapshot = await getDocs(q);
		querySnapshot.forEach((doc) => {
			// doc.data() is never undefined for query doc snapshots
			result.push({
				id: doc.id,
				...doc.data(),
			});
		});

		console.log("result", result);

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
export const firestore = { create, list, collections };
