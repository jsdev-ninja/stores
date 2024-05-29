import { getApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Get a non-default Storage bucket
const firebaseApp = getApp();
const storage = getStorage(firebaseApp);

function createRef(path: string) {
	const storageRef = ref(storage, path);
	return storageRef;
}

async function upload(name: string, file: File) {
	const res = await uploadBytes(createRef(name), file);
	const url = await getDownloadURL(res.ref);
	console.log("url", url);

	return { ...res, url };
}

export const firebaseStorage = { upload };
