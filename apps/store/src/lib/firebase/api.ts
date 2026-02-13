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

// dupliacte form functions/src/services/ezCountService/index.ts
export enum VAT_TYPE {
	PRE = "PRE",
	INC = "INC",
	NON = "NON",
}
export type Params = {
	transaction_id: string;
	customer_name: string;
	customer_email: string;
	customer_address?: string;
	customer_phone?: string;
	description?: string;
	parent?: string; // parens docs (1,2,3,4)
	cc_emails?: string[];
	item?: {
		details: string;
		price: number;
		amount: number;
		vat_type: VAT_TYPE;
	}[];
	price_total?: number;
	date?: string; // (DD/MM/YYYY)
};

export enum DOC_TYPE {
	ORDER = 100, // הזמנה (Order)
	DELIVERY = 200, // תעודת משלוח (Delivery)
	RETURN = 210, // תעודת החזרה (Return)
	PROFORMA_INVOICE = 300, // חשבונית עסקה (Proforma Invoice)
	TAX_INVOICE = 305, // חשבונית מס(Tax invoice)
	INVOICE_RECEIPT = 320, // חשבונית מס קבלה(Invoice Receipt)
	CREDIT_INVOICE = 330, // חשבונית זיכוי(Credit invoice)
	RECEIPT = 400, // קבלה(Receipt)
	RECEIPT_DONATION = 405, // קבלה על תרומה(Receipt for donation)
	PURCHASE_ORDER = 500, // הזמנת רכש(Purchase order)
	BID = 9999, // הצעת מחיר(Bid)
	DEPOSIT_APPROVAL = 9998, // קבלת פקדון (Deposit Approval)
	DEPOSIT_RELEASE = 9997, // קבלת פקדון (Deposit Release)
}

async function createInvoice(
	storeId: string,
	{ orders, params }: { orders: TOrder[]; params: Params },
) {
	try {
		const func = httpsCallable(functions, "createInvoice");
		const response = await func({ orders, params, storeId });
		return { success: true, data: response.data };
	} catch (error: any) {
		const code = error.code;
		const message = error.message;
		const details = error.details;
		console.error(code, message, details);
		return { success: false, data: null };
	}
}

async function createPayment({ order, isJ5 }: { order: TOrder; isJ5?: boolean }) {
	try {
		const func = httpsCallable(functions, "createPayment");

		const response = await func({ order, isJ5 });
		return { success: true, data: response.data };
	} catch (error: any) {
		const code = error.code;
		const message = error.message;
		const details = error.details;
		console.error(code, message, details);
		return { success: false, data: null };
	}
}
async function chargeOrder({ order }: { order: TOrder }) {
	try {
		const func = httpsCallable(functions, "chargeOrder");

		const response = await func({ order });
		return { success: true, data: response.data };
	} catch (error: any) {
		const code = error.code;
		const message = error.message;
		const details = error.details;
		console.error(code, message, details);
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
		console.error(code, message, details);
		return { success: false, data: null };
	}
}

async function createDeliveryNote({
	order,
	options,
}: {
	order: TOrder;
	options?: { date?: number; sendEmailToClient?: boolean };
}) {
	try {
		const func = httpsCallable(functions, "createDeliveryNote");

		const response = await func({ order, options });
		return { success: true, data: response.data };
	} catch (error: any) {
		const code = error.code;
		const message = error.message;
		const details = error.details;
		console.error(code, message, details);
		return { success: false, data: null, error: message };
	}
}

export type OpenAiChatResult = {
	success: boolean;
	data: { content: string | null; role: string } | null;
	error?: string;
};

async function openAiChat(prompt: string, context: { cartId?: string }): Promise<OpenAiChatResult> {
	try {
		const func = httpsCallable(functions, "openAiAPi");
		const response = await func({ prompt, context });
		const data = response.data as { content: string | null; role: string };
		return { success: true, data };
	} catch (error: any) {
		const message = error?.message ?? "Unknown error";
		console.error("openAiChat", error);
		return { success: false, data: null, error: message };
	}
}

export const api = {
	init,
	createCompanyClient,
	createPayment,
	chargeOrder,
	uiLogs,
	createInvoice,
	createDeliveryNote,
	openAiChat,
};
