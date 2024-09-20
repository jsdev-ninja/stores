// CLIENT_IN_WEBSITE_PAYMENT - pay inside website via checkout process
// CLIENT_IN_STORE_PAYMENT - store owner handle client payment
// COMPANY_IN_STORE_PAYMENT - store owner handle client payment
type PaymentFlowType =
	| "CLIENT_IN_WEBSITE_PAYMENT"
	| "CLIENT_IN_STORE_PAYMENT"
	| "COMPANY_IN_STORE_PAYMENT";

export interface PaymentStrategy {
	type: PaymentFlowType;
}

export class PaymentContext {}
