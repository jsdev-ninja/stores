import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./app";

const functions = getFunctions(app);

async function init() {
	try {
		const func = httpsCallable(functions, "appInit");

		const response = await func();
		return { success: true, data: response.data };
	} catch (error: any) {
		const code = error.code;
		const message = error.message;
		const details = error.details;
		console.log(code, message, details);
		return { success: false, data: null };
	}
}

export const api = { init };
