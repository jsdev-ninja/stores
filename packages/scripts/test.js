const url = "https://apiqa.invoice4u.co.il/Services/ApiService.svc/ProcessApiRequestV2";
const email = "Test@test.com";
const password = "Test@test.com";

const API_KEY = "b57bcbb3-091c-4d70-b131-6bc9c90e1070";

async function clearingRequest() {
	try {
		const res = await fetch(url, {
			method: "POST",
			url: url,
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				request: {
					Invoice4UUserApiKey: API_KEY,
					Type: "1",
					CreditCardCompanyType: "1",
					FullName: "customer name",
					Phone: "0534290355",
					Email: "email@invoice4u.co.il",
					Sum: "1",
					Description: "Invoice4U Clearing via API",
					PaymentsNum: "1",
					Currency: "ILS",
					// OrderIdClientUsage: "140001",
					IsDocCreate: "true",
					DocHeadline: "Document headline",
					Comments: "Document comments",
					IsManualDocCreationsWithParams: "false",
					DocItemQuantity: "1|1",
					DocItemPrice: "10|10",
					DocItemTaxRate: "17|17",
					IsItemsBase64Encoded: "false",
					DocItemName: "first item|second item",
					IsGeneralClient: "true",
					IsAutoCreateCustomer: "true",
					ReturnUrl: "https://www.invoice4u.co.il/",
					AddTokenAndCharge: "false",
					Refund: "false",
					IsStandingOrderClearance: "false",
					StandingOrderDuration: "0",
					ChargeWithToken: "false",
					AddToken: "true",
				},
			}),
		});
		const body = await res.json();

		console.log("res", res.status);

		console.log("Status:", res.status, res.statusText);
		console.log("body:", body.d);
		console.log("errors:", body.d.Errors);
	} catch (error) {
		console.log("error", error);
	}
}

clearingRequest();
