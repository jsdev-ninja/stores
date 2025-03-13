/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	addDoc,
	collection,
	doc,
	deleteDoc,
	getDoc,
	getDocs,
	getFirestore,
	limit,
	onSnapshot,
	query,
	setDoc,
	updateDoc,
	arrayUnion,
	WhereFilterOp,
	where,
	orderBy,
	UpdateData,
	runTransaction,
} from "firebase/firestore";
import { app } from "./app";

const db = getFirestore(app);

async function remove({ id, collectionName }: { id: string; collectionName: string }) {
	try {
		await deleteDoc(doc(db, collectionName, id));

		return { success: true, data: id };
	} catch (error) {
		console.error(error);
		return { success: false };
	}
}

async function setV2<T extends { id?: string } = any>(data: { collection: string; doc: T }) {
	try {
		const id = data.doc.id ?? generateDocId(data.collection);
		await setDoc(doc(db, data.collection, id), data.doc, { merge: true });
		const result = { ...data.doc, id: id };

		return { success: true, data: result };
	} catch (error) {
		console.error(error);
		return { success: false };
	}
}

async function createV2<T extends { id?: string }>(data: {
	collection: string;
	doc: T;
	id?: string;
}) {
	try {
		return await runTransaction(
			db,
			async (transaction) => {
				const docRef = doc(db, data.collection, data.doc.id ?? generateDocId(data.collection)); // Reference to the document with a custom ID

				// Check if the document already exists within the transaction
				const docSnapshot = await transaction.get(docRef);

				if (docSnapshot.exists()) {
					return { success: false };
				} else {
					// Document does not exist, proceed to create it
					transaction.set(docRef, data.doc);
					return { success: true };
				}
			},
			{ maxAttempts: 1 }
		);
	} catch (error) {
		console.error("Error adding document with transaction:", error);
		return { success: false };
	}
}

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
async function update<T extends object = any>(id: string, item: UpdateData<T>, coll: any) {
	try {
		await updateDoc(doc(db, coll, id), item);

		const data = { ...item };

		console.log("firestore.update success", data);

		return { success: true, data };
	} catch (error) {
		console.error(error);
		return { success: false, error };
	}
}
async function set(id: string, item: any) {
	try {
		await setDoc(doc(db, id), item, { merge: true });

		const data = { ...item, id: id };

		return { success: true, data };
	} catch (error) {
		console.error(error);
		return { success: false };
	}
}

async function getV2<T extends object>(data: { collection: string; id: string }) {
	try {
		const q = doc(db, data.collection, data.id);

		const querySnapshot = await getDoc(q);

		if (!querySnapshot.exists()) {
			return { success: true, data: null };
		}

		const result: T = { ...querySnapshot.data(), id: querySnapshot.id } as T;

		return { success: true, data: result };
	} catch (error) {
		console.error(error);
		return { success: false, data: null };
	}
}

async function listV2<T>(data: {
	collection: string;
	where?: Array<{
		name: keyof T & string;
		value: any;
		operator: WhereFilterOp;
	}>;
	sort?: Array<{ name: keyof T & string; value: "desc" | "asc" }>;
}) {
	try {
		const filters = data.where ?? [];
		const sort = data.sort ?? [];
		const order = sort.map((s) => orderBy(s.name, s.value));
		const wheres = filters.map((filter) => where(filter.name, filter.operator, filter.value));
		const q = query(collection(db, data.collection), ...wheres, ...order, limit(150));

		const result: any[] = [];
		const querySnapshot = await getDocs(q);

		querySnapshot.forEach((doc) => {
			// doc.data() is never undefined for query doc snapshots
			result.push({
				id: doc.id,
				...doc.data(),
			});
		});

		return { success: true, data: result as T[] };
	} catch (error) {
		console.error(error);
		return { success: false, data: [] };
	}
}

function subscribeDocV2<T>(data: {
	callback: (data: T | null) => void;
	collection: string;
	id?: string;
	where?: Array<{
		name: keyof T & string;
		value: any;
		operator: WhereFilterOp;
	}>;
}) {
	const colRef = collection(db, data.collection);
	const docRef = data.id ? doc(db, data.collection, data.id) : null;
	const filters = data.where ?? [];
	const wheres = filters.map((filter) => where(filter.name, filter.operator, filter.value));
	const q = query(colRef, ...wheres);

	if (docRef) {
		return onSnapshot(docRef, (querySnapshot) => {
			if (!querySnapshot.exists()) return data.callback(null);

			const result = {
				id: querySnapshot.id,
				...querySnapshot.data(),
			};
			data.callback(result as unknown as T);
		});
	}

	return onSnapshot(q, (querySnapshot) => {
		if (querySnapshot.empty) return data.callback(null);
		const result = querySnapshot.docs[0];
		data.callback({ ...result.data(), id: result.id } as T);
	});
}
function subscribeList<T>(data: {
	callback: (data: T[]) => void;
	collection: string;
	where?: Array<{
		name: keyof T & string;
		value: any;
		operator: WhereFilterOp;
	}>;
}) {
	const colRef = collection(db, data.collection);
	const filters = data.where ?? [];
	const wheres = filters.map((filter) => where(filter.name, filter.operator, filter.value));
	const q = query(colRef, ...wheres);

	return onSnapshot(q, (querySnapshot) => {
		const result: T[] = [];
		if (querySnapshot.empty) return data.callback([]);
		querySnapshot.forEach((doc) => {
			result.push({
				...(doc.data() as T),
				id: doc.id,
			});
		});
		data.callback(result);
	});
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

async function get<T extends object>(id: string, coll: string) {
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

function generateDocId(collectionName: string) {
	return doc(collection(db, collectionName)).id;
}

const collections = {
	products: "products",
	categories: "categories",
};
export const firestore = {
	generateDocId,
	create,
	remove,
	list,
	collections,
	get,
	getV2,
	set,
	subscribeDoc,
	subscribeDocV2,
	subscribeList,
	createV2,
	setV2,
	listV2,
	update,
	arrayUnion,
};
