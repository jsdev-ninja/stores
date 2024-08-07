/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	addDoc,
	collection,
	doc,
	getDoc,
	getDocs,
	getFirestore,
	limit,
	onSnapshot,
	query,
	setDoc,
	updateDoc,
	arrayUnion,
} from "firebase/firestore";
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
async function update(id: string, item: any, coll: any) {
	try {
		await updateDoc(doc(db, coll, id), item);

		const data = { ...item };

		return { success: true, data };
	} catch (error) {
		console.error(error);
		return { success: false, error };
	}
}
async function set(id: string, item: any) {
	try {
		await setDoc(doc(db, id), item);

		const data = { ...item, id: id };

		return { success: true, data };
	} catch (error) {
		console.error(error);
		return { success: false };
	}
}

function subscribeDoc(col: string, id: string, callback: any) {
	return onSnapshot(doc(db, col, id), (querySnapshot) => {
		const data = {
			id: querySnapshot.id,
			...querySnapshot.data(),
		};
		callback(data);
	});
}

async function get<T extends { id: string }>(id: string, coll: string) {
	try {
		const q = doc(db, coll, id);

		const querySnapshot = await getDoc(q);

		const data = querySnapshot.data() as T;

		if (!querySnapshot.exists()) {
			return { success: true, data: null };
		}

		const result = { ...data, id: querySnapshot.id };

		return { success: true, data: result };
	} catch (error) {
		console.error(error);
		return { success: false, data: null };
	}
}

async function list(coll: any) {
	try {
		const q = query(collection(db, coll), limit(150)); //where("parentId", "==", "")

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
export const firestore = { arrayUnion, create, list, collections, get, set, subscribeDoc, update };
