import { getApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// Get a non-default Storage bucket
const firebaseApp = getApp();
const storage = getStorage(firebaseApp);

function createRef(path: string) {
	const storageRef = ref(storage, path);
	return storageRef;
}

async function upload(path: string, file: File) {
	const res = await uploadBytes(createRef(path), file);
	const url = await getDownloadURL(res.ref);

	return { ...res, url };
}
async function remove(ref: string) {
	await deleteObject(createRef(ref));
	console.log("storage.remove success");

	return { success: true };
}

export const firebaseStorage = { upload, remove };
