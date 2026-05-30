// Public surface of the ledger module.
// DO NOT import this into functions/src/index.tsx — module is standalone until wired in a later step.

// Types + schemas
export {
	TransactionSchema,
	TransactionTypeSchema,
	PaymentLinkSchema,
	DuplicateChargeAlertSchema,
} from "./types";
export type {
	Transaction,
	TransactionType,
	PaymentLink,
	DuplicateChargeAlert,
} from "./types";

// Events
export {
	LedgerEventTypes,
	TransactionPostedPayload,
	DuplicateChargeDetectedPayload,
} from "./events";
export type {
	TransactionPostedPayload as TTransactionPostedPayload,
	DuplicateChargeDetectedPayload as TDuplicateChargeDetectedPayload,
} from "./events";

// Admin callables (require admin custom claim + token-derived tenant)
export { postManualTransaction } from "./api/postManualTransaction";
export { captureHypJ5 } from "./api/captureHypJ5";
export { createHypDirectPaymentLink } from "./api/createHypDirectPaymentLink";

// Customer-facing callables (VERIFY-gated or ownership-gated, no admin claim required)
export { createHypCheckoutPayment } from "./api/createHypCheckoutPayment";
export { recordHypJ5Auth } from "./api/recordHypJ5Auth";
export { recordHypDirectPayment } from "./api/recordHypDirectPayment";

// Public callable (token only, no auth)
export { getPaymentLink } from "./api/getPaymentLink";
