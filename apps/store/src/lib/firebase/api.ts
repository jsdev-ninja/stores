import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./app";
import { TOrder } from "@jsdev_ninja/core";
import { TCompany } from "src/domains/Company";
import { CONFIG } from "src/config";

type TBudgetAccount = {
	id: string;
	organizationId: string;
	organizationName: string;
	companyId: string;
	storeId: string;
	totalDebits: number;
	totalCredits: number;
	balance: number;
	currency: "ILS";
	updatedAt: number;
};

type TBudgetTransaction = {
	id: string;
	type: string;
	amount: number;
	runningBalance: number;
	orderId: string | null;
	orderTotal: number | null;
	billingAccountId: string | null;
	billingAccountName: string | null;
	billingAccountNumber: string | null;
	paymentReference: string | null;
	paymentDate: number | null;
	paymentMethod: string | null;
	note: string | null;
	createdAt: number;
	createdBy: string;
};

type TPaymentMethod = "check" | "bank_transfer" | "cash" | "credit_card" | "other";

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

export type ChatHistoryItem = {
	role: "user" | "bot";
	text: string;
};

export type ChatbotResult = {
	success: boolean;
	data: { content: string | null } | null;
	error?: string;
};

async function chatbotChat(
	prompt: string,
	history: ChatHistoryItem[],
	context: { cartId?: string; storeId?: string; companyId?: string },
): Promise<ChatbotResult> {
	try {
		const func = httpsCallable(functions, "chatbotApi");
		const response = await func({ prompt, history, context });
		const data = response.data as { content: string | null };
		return { success: true, data };
	} catch (error: any) {
		const message = error?.message ?? "Unknown error";
		console.error("chatbotChat", error);
		return { success: false, data: null, error: message };
	}
}

async function listBudgetAccounts() {
	const func = httpsCallable(functions, "listBudgetAccounts");
	const res = await func();
	return res.data as { success: boolean; data: TBudgetAccount[] };
}

async function getBudgetAccount(organizationId: string) {
	const func = httpsCallable(functions, "getBudgetAccount");
	const res = await func({ organizationId });
	return res.data as { success: boolean; data: TBudgetAccount | null };
}

async function getBudgetTransactions(organizationId: string, billingAccountId?: string) {
	const func = httpsCallable(functions, "getBudgetTransactions");
	const res = await func({ organizationId, billingAccountId });
	return res.data as { success: boolean; data: TBudgetTransaction[] };
}

async function markOrderPaid(params: {
	order: TOrder;
	organizationId: string;
	organizationName: string;
	debt: number;
	paymentMethod: TPaymentMethod;
	paymentReference: string | null;
	paymentDate: number;
	note: string | null;
}) {
	const func = httpsCallable(functions, "markOrderPaid");
	const res = await func(params);
	return res.data as { success: boolean };
}

async function addBudgetManualTransaction(params: {
	organizationId: string;
	organizationName: string;
	type: "credit_note" | "debit_note";
	debt: number;
	note: string;
}) {
	const func = httpsCallable(functions, "addBudgetManualTransaction");
	const res = await func(params);
	return res.data as { success: boolean };
}

type TOrganizationAction = {
	id: string;
	type: "order.created" | "delivery_note.created" | "invoice.created" | "payment.completed";
	orderId: string;
	orderTotal: number;
	billingAccountId: string | null;
	billingAccountName: string | null;
	billingAccountNumber: string | null;
	date: number;
	createdAt: number;
	meta: Record<string, any>;
};

async function getOrganizationActions(organizationId: string, billingAccountId?: string) {
	const func = httpsCallable(functions, "getOrganizationActions");
	const res = await func({ organizationId, billingAccountId });
	return res.data as { success: boolean; data: TOrganizationAction[] };
}

export const api = {
	init,
	createCompanyClient,
	createPayment,
	chargeOrder,
	uiLogs,
	createInvoice,
	createDeliveryNote,
	chatbotChat,
	listBudgetAccounts,
	getBudgetAccount,
	getBudgetTransactions,
	markOrderPaid,
	addBudgetManualTransaction,
	getOrganizationActions,
};
