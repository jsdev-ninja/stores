import { TPaymentLinkRequest } from "../entities/Payment";

const baseUrl = "https://pay.hyp.co.il/p/";

function objectToQueryParams<T extends { [key: string]: any }>(obj: T) {
	return Object.keys(obj)
		.map((key: keyof T & string) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
		.join("&");
}

export const hypPaymentService = {
	async chargeJ5Transaction(params: TPaymentLinkRequest) {
		try {
			const tokenParams = objectToQueryParams({});

			const tokenResponse = await fetch(`${baseUrl}?${tokenParams}`);
			const token = await tokenResponse.text();

			// todo Tmonth=mm&Tyear=yyyy

			const transParams = objectToQueryParams({
				action: "soft",
			});
			const transactionCommit = await fetch(`${baseUrl}?${transParams}`);
			const transactionData = await transactionCommit.text();

			return { success: true };
		} catch (error: any) {
			console.log(error);
			return { success: false, errMessage: error.message };
		}
	},
	async createPaymentLink(params: TPaymentLinkRequest) {
		try {
			const queryString = objectToQueryParams(params);

			const url = `${baseUrl}?${queryString}`;

			console.log("createPaymentLink url", url);

			const signResponse = await fetch(url);

			const linkData = await signResponse.text();

			const paymentLink = `${baseUrl}?${linkData}`;

			return { success: true, paymentLink };
		} catch (error: any) {
			console.log(error);
			return { success: false, errMessage: error.message };
		}
	},
} as const;
