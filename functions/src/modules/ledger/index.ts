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
export { LedgerEventTypes, TransactionPostedPayload } from "./events";
export type { TransactionPostedPayload as TTransactionPostedPayload } from "./events";

// ===========================================================================
// HYP payment callables — grouped by flow. Two implementations coexist:
//   ✅ CANONICAL = the target (server-side, signature-verified). Built + deployed.
//   🟥 LEGACY    = what the storefront/admin ACTUALLY call today. To be retired
//                  once the storefront/admin are repointed to the canonical ones.
// ===========================================================================

// --- J5 flow (authorize hold, then capture) ---
export { recordHypJ5Auth } from "./api/recordHypJ5Auth";          // ✅ record an auth (server)
export { captureHypJ5 } from "./api/captureHypJ5";                // ✅ capture the hold (admin)
export { chargeOrder } from "./api/chargeOrder";                  // 🟥 LEGACY capture (admin) — live today

// --- Direct payment (immediate charge) ---
export { createHypDirectPaymentLink } from "./api/createHypDirectPaymentLink"; // ✅ admin makes a link
export { createHypCheckoutPayment } from "./api/createHypCheckoutPayment";     // ✅ customer checkout link
export { recordHypDirectPayment } from "./api/recordHypDirectPayment";         // ✅ record the result (server, VERIFY)
export { createPayment } from "./api/createPayment";              // 🟥 LEGACY link create — live today
export { createPaymentRedirect } from "./api/createPaymentRedirect"; // 🟥 LEGACY admin link — live today
export { getPaymentRedirect } from "./api/getPaymentRedirect";    // 🟥 LEGACY fetch redirect link — live today
export { getPaymentLink } from "./api/getPaymentLink";            // ✅ fetch a link by token

// --- Manual admin entry (no HYP) ---
export { postManualTransaction } from "./api/postManualTransaction"; // ✅ admin records money taken outside HYP

// AR accrual on delivery note: previously postDebitOnDeliveryNoteCreated lived here.
// It has been DELETED — accrual now lives in documents/subscribers/accrueOnDeliveryNoteCreated.ts.
// No subscribers re-exported from the ledger module.
