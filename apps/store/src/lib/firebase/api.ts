import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./app";
import { TOrder } from "@jsdev_ninja/core";
import { TCompany } from "src/domains/Company";
import { CONFIG } from "src/config";

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

export type LogPayload = {
	message: string;
	severity: "DEBUG" | "INFO" | "NOTICE" | "WARNING" | "ERROR" | "CRITICAL" | "ALERT" | "EMERGENCY";
	userId?: string;
	companyId?: string;
	storeId?: string;
	tenantId?: string;
	[key: string]: any; // Allows any additional properties
};

async function uiLogs(payload: LogPayload) {
	try {
		CONFIG.DEV && console.log(`[${payload.severity.toUpperCase()}]`, payload.message, payload);

		const func = httpsCallable(functions, "uiLogs");

		const response = await func(payload);
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
async function chargeOrder({ orderId }: { orderId: TOrder["id"] }) {
	try {
		const func = httpsCallable(functions, "chargeOrder");

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

export const api = { init, createCompanyClient, createPayment, chargeOrder, uiLogs };
