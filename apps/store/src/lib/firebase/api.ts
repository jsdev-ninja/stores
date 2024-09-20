import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./app";
import { TNewCompany } from "src/types";

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

async function createCompanyClient(company: TNewCompany) {
	try {
		const func = httpsCallable(functions, "createCompanyClient");

		const response = await func(company);
		return { success: true, data: response.data };
	} catch (error: any) {
		const code = error.code;
		const message = error.message;
		const details = error.details;
		console.log(code, message, details);
		return { success: false, data: null };
	}
}

export const api = { init, createCompanyClient };
