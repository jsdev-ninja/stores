import { TPaymentLinkRequest } from "../entities/Payment";

const baseUrl = "https://pay.hyp.co.il/p/";

function objectToQueryParams(obj: any) {
	return Object.keys(obj)
		.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
		.join("&");
}

export const hypPaymentService = {
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
