import { logger } from "../../core";

import {
	THypSoftTransactionRequest,
	THypTokenRequest,
	THypTokenResponse,
	TPaymentLinkRequest,
} from "../../schema";

const baseUrl = "https://pay.hyp.co.il/p/";

function objectToQueryParams<T extends { [key: string]: any }>(obj: T) {
	return Object.keys(obj)
		.map((key: keyof T & string) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
		.join("&");
}
function splitYYMM(yyMM: string): { month: string; year: string } {
	if (!/^\d{4}$/.test(yyMM)) {
		throw new Error("Invalid YYMM format. Expected 4-digit string (YYMM).");
	}

	const yy = yyMM.slice(0, 2); // First 2 digits → Year
	const mm = yyMM.slice(2, 4); // Last 2 digits → Month

	const currentYear = new Date().getFullYear(); // Get current full year (e.g., 2024)
	const century = Math.floor(currentYear / 100) * 100; // Get century (e.g., 2000)

	const fullYear = century + parseInt(yy, 10);

	// Handle future dates: Assume YY < current YY is from the current century, else from the past century
	const currentYY = currentYear % 100;
	const correctedYear = parseInt(yy, 10) > currentYY ? fullYear - 100 : fullYear;

	return { month: mm, year: correctedYear.toString() };
}

type chargeJ5TransactionParams = {
	transactionId: string;
	masof: string;
	masofPassword: string;
	originalAmount: number;
	actualAmount: number;
	orderId: string;
	creditCardConfirmNumber: string;
	transactionUID: string;
	clientName: string;
	clientLastName: string;
	email: string;
	heshDesc?: string;
	Pritim: string;
};

// parse hyp text response
function parseQueryString<T extends Record<string, string>>(query: string): T {
	return query.split("&").reduce((acc, param) => {
		const idx = param.indexOf("=");
		if (idx > 0) {
			const key = param.slice(0, idx);
			const value = param.slice(idx + 1);
			acc[key as keyof T] = decodeURIComponent(value) as T[keyof T];
		}
		return acc;
	}, {} as T);
}

export const hypPaymentService = {
	async chargeJ5Transaction(params: chargeJ5TransactionParams) {
		try {
			logger.write({
				severity: "INFO",
				message: "hypPaymentService.chargeJ5Transaction",
				params,
			});

			const tokenParams = objectToQueryParams<THypTokenRequest>({
				action: "getToken",
				allowFalse: "True",
				Masof: params.masof,
				PassP: params.masofPassword,
				TransId: params.transactionId,
			});

			const tokenResponse = await fetch(`${baseUrl}?${tokenParams}`);
			const body = await tokenResponse.text();
			const tokenData = parseQueryString<THypTokenResponse>(body);

			logger.write({
				severity: "INFO",
				message: "hypPaymentService.chargeJ5Transaction tokenData",
				tokenData,
			});

			const cardValidityDate = splitYYMM(tokenData.Tokef);
			const originalAmount = Math.round(Number(params.originalAmount) * 100);
			const transParams = objectToQueryParams<THypSoftTransactionRequest>({
				action: "soft",
				MoreData: "True",
				UTF8: "True",
				UTF8out: "True",
				"inputObj.originalUid": params.transactionUID,
				"inputObj.originalAmount": originalAmount.toString(),
				"inputObj.authorizationCodeManpik": "7",
				Amount: Number(params.actualAmount).toFixed(2),
				AuthNum: params.creditCardConfirmNumber,
				Info: "balasi store",
				Masof: params.masof,
				PassP: params.masofPassword,
				Tash: "1",
				Tmonth: cardValidityDate.month,
				Tyear: cardValidityDate.year,
				Order: params.orderId,
				CC: tokenData.Token,
				UserId: "000000000",
				ClientName: params.clientName,
				// ClientLName: params.clientLastName,
				ClientLName: "",
				email: params.email,
				Token: "True",
				FixTash: "True",
				sendemail: "True",
				SendHesh: "True",
				heshDesc: params.heshDesc,
				Pritim: params.Pritim,
			});

			logger.write({
				severity: "INFO",
				message: "hypPaymentService.chargeJ5Transaction url",
				url: `${baseUrl} (POST, body length ${transParams.length})`,
			});

			// POST instead of GET — HYP returns 414 on long URIs for large carts
			const transactionCommit = await fetch(baseUrl, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: transParams,
			});
			const transactionData = await transactionCommit.text();
			const transactionResult: any = parseQueryString(transactionData);
			logger.write({
				severity: "INFO",
				message: "hypPaymentService.chargeJ5Transaction transactionResult",
				transactionResult,
				transactionData,
				transParams,
				cardValidityDate,
				originalAmount,
			});

			return {
				success: Number(transactionResult.CCode) === 0,
				data: transactionResult,
				errMessage: null,
			};
		} catch (error: any) {
			logger.write({
				severity: "ALERT",
				message: "hypPaymentService.chargeJ5Transaction error",
				error: error,
				params,
			});
			return { success: false, errMessage: error.message, data: null };
		}
	},
	async createPaymentLink(params: TPaymentLinkRequest) {
		try {
			logger.write({
				severity: "INFO",
				message: "hypPaymentService.createPaymentLink",
				params,
			});
			const formBody = objectToQueryParams(params);

			// POST instead of GET — HYP returns 414 on long URIs for large carts
			const signResponse = await fetch(baseUrl, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: formBody,
			});

			if (!signResponse.ok) {
				const errorBody = await signResponse.text();
				logger.write({
					severity: "ALERT",
					message: "hypPaymentService.createPaymentLink HTTP error",
					status: signResponse.status,
					statusText: signResponse.statusText,
					body: errorBody,
					params,
				});
				return { success: false, errMessage: `HYP returned ${signResponse.status}`, paymentLink: null, formAction: null, formFields: null };
			}

			const linkData = (await signResponse.text()).trim();

			if (linkData.startsWith("<") || linkData.toLowerCase().includes("<html") || !linkData.includes("=")) {
				logger.write({
					severity: "ALERT",
					message: "hypPaymentService.createPaymentLink non-signed response",
					body: linkData,
					params,
				});
				return { success: false, errMessage: "HYP returned non-signed response", paymentLink: null, formAction: null, formFields: null };
			}

			const paymentLink = `${baseUrl}?${linkData}`;
			// parse into discrete fields so the client can form-POST and avoid 414
			const formFields = parseQueryString<Record<string, string>>(linkData);

			logger.write({
				severity: "INFO",
				message: "hypPaymentService.createPaymentLink success",
				params,
				paymentLink,
				formFieldsCount: Object.keys(formFields).length,
			});

			return { success: true, paymentLink, formAction: baseUrl, formFields, errMessage: null };
		} catch (error: any) {
			logger.write({
				severity: "ALERT",
				message: "hypPaymentService.createPaymentLink error",
				error: error,
				params,
			});
			return { success: false, errMessage: error.message, paymentLink: null, formAction: null, formFields: null };
		}
	},
} as const;
