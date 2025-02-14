import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./app";
import { TOrder } from "@jsdev_ninja/core";
import { TCompany } from "src/domains/Company";

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
		console.error(code, message, details);
		return { success: false, data: null };
	}
}

async function createPayment({ order }: { order: TOrder }) {
	try {
		const func = httpsCallable(functions, "createPayment");

		const response = await func({ order });
		return { success: true, data: response.data };
	} catch (error: any) {
		const code = error.code;
		const message = error.message;
		const details = error.details;
		console.log(code, message, details);
		return { success: false, data: null };
	}
}
async function chargeOrder({ orderId }: { order: TOrder["id"] }) {
	try {
		const func = httpsCallable(functions, "createPayment");

		const response = await func({ orderId });
		return { success: true, data: response.data };
	} catch (error: any) {
		const code = error.code;
		const message = error.message;
		const details = error.details;
		console.log(code, message, details);
		return { success: false, data: null };
	}
}

async function createCompanyClient(company: TCompany) {
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

export const api = { init, createCompanyClient, createPayment, chargeOrder };
