import { FirebaseError } from "firebase/app";

export function handleError(error: FirebaseError) {
	return { success: false, code: error.code, errMessage: error.message } as const;
}
