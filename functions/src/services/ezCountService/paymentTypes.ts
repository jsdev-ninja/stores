/**
 * EZcount payment_type codes for receipts.
 *
 * These are the only payment methods supported by recordInvoicePayment in this
 * iteration. Partial payments and additional methods are NOT supported.
 *
 * Reference: EZcount API docs, /api/createDoc, payment[] field.
 */

export type PaymentMethod = "cash" | "check" | "bank_transfer" | "credit_card";

/** EZcount integer codes for each payment method. */
const PAYMENT_TYPE_CODES: Record<PaymentMethod, number> = {
	cash: 1,
	check: 2,
	bank_transfer: 3,
	credit_card: 4,
};

/**
 * Map a PaymentMethod string to the corresponding EZcount payment_type integer.
 * Throws if the method is not in the supported set (defensive — callers validate
 * input with Zod before calling this, so this should never throw in production).
 */
export function toEzCountPaymentType(method: PaymentMethod): number {
	const code = PAYMENT_TYPE_CODES[method];
	if (code === undefined) {
		throw new Error(`ezCountService: unsupported payment method: ${method}`);
	}
	return code;
}
