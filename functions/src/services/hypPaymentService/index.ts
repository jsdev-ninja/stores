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
		const [key, value] = param.split("=");
		if (key && value) {
			acc[key as keyof T] = decodeURIComponent(value) as T[keyof T];
		}
		return acc;
	}, {} as T);
}

export const hypPaymentService = {
	async chargeJ5Transaction(params: chargeJ5TransactionParams) {
		try {
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

			const cardValidityDate = splitYYMM(tokenData.Tokef);

			// todo Tmonth=mm&Tyear=yyyy

			const originalAmount = Math.round(Number(params.originalAmount) * 100);

			const transParams = objectToQueryParams<THypSoftTransactionRequest>({
				action: "soft",
				MoreData: "True",
				UTF8: "True",
				UTF8out: "True",
				"inputObj.originalUid": params.transactionUID,
				"inputObj.originalAmount": originalAmount.toString(),
				"inputObj.authorizationCodeManpik": "7",
				Amount: params.actualAmount.toString(),
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
				// heshDesc: params.heshDesc,
				Pritim: params.Pritim,
			});
			console.log("transParams", transParams);

			const transactionCommit = await fetch(`${baseUrl}?${transParams}`);
			const transactionData = await transactionCommit.text();
			console.log("actualAmount", params.actualAmount.toString());
			console.log("originalAmount", params.originalAmount.toString());
			console.log("transactionData", transactionData);
			const transactionResult: any = parseQueryString(transactionData);
			console.log("JSON.stringify(transactionResult)", JSON.stringify(transactionResult));

			return { success: Number(transactionResult.CCode) === 0, data: transactionResult };
		} catch (error: any) {
			console.log(error);
			return { success: false, errMessage: error.message, data: null };
		}
	},
	async createPaymentLink(params: TPaymentLinkRequest) {
		try {
			const queryString = objectToQueryParams(params);

			const url = `${baseUrl}?${queryString}`;

			console.log("createPaymentLink url", url);

			const signResponse = await fetch(url);

			const linkData = await signResponse.text();

			console.log("linkData", linkData);

			const paymentLink = `${baseUrl}?${linkData}`;

			return { success: true, paymentLink };
		} catch (error: any) {
			console.log(error);
			return { success: false, errMessage: error.message };
		}
	},
} as const;
