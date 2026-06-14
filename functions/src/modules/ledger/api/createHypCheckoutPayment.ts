import * as functions from "firebase-functions/v1";
import { logger } from "firebase-functions/v2";
import admin from "firebase-admin";
import { z } from "zod";
import { FirebaseAPI, TOrder } from "@jsdev_ninja/core";
import { TStorePrivate } from "src/schema";
import { hypPaymentService } from "../../../services/hypPaymentService";
import { sanitizeFormFields } from "../internal/sanitizeFormFields";

const InputSchema = z.object({
	orderId: z.string().min(1),
	companyId: z.string().min(1),
	storeId: z.string().min(1),
	/** J5 deferred-capture mode — defaults to true for checkout flow */
	isJ5: z.boolean().default(true),
});

// HYP/EzCount recomputes each heshDesc line as `qty × price`, rounds it the way
// the raw float naturally rounds (= toFixed(2)), then sums. `Amount` MUST equal
// that sum exactly or HYP rejects with CCode=400 ("סכום הפריטים אינו תואם לסכום לחיוב").
//
// We derive Amount from the SAME per-line toFixed rounding HYP uses — NOT a raw
// float sum (e.g. 16.87 + 24.90 = 41.769999999999996, which serialises to a
// non-2dp string and diverges from HYP's 41.77 line sum). Bill exactly the
// heshDesc line total, never order.cart.cartTotal (which can drift by an agora).
function sumHeshDescItems(items: string[]): number {
	const itemsSum = items.reduce((sum, line) => {
		const m = line.match(/~([\d.]+)~([\d.]+)\]$/);
		if (!m) return sum;
		return sum + Number((parseFloat(m[1]) * parseFloat(m[2])).toFixed(2));
	}, 0);
	return Number(itemsSum.toFixed(2));
}

/**
 * Customer-facing callable — generates a signed HYP J5 payment form for
 * the customer checkout flow.
 *
 * Auth model:
 *   - Requires context.auth?.uid (Firebase Auth UID, including anonymous users).
 *   - Anonymous users are allowed: checkout sets order.userId = user.uid for
 *     both anonymous and non-anonymous Firebase users. Ownership is enforced by
 *     comparing order.userId === uid, which is secure regardless of anonymous status.
 *   - No admin claim required — this is the customer checkout path.
 *
 * Security invariants:
 *   - Amount comes from the server-loaded order.cart.cartTotal, NOT from client input.
 *   - Store HYP credentials are loaded server-side from STORES/{storeId}/private/data.
 *   - Credentials (KEY, PassP, masof) are never logged or returned to the client.
 *   - formFields are sanitized through the shared denylist before returning.
 *   - NO ledger transaction is written — money has not yet moved at this point.
 *   - NO paymentLinks doc is created — this is immediate checkout, not a shareable link.
 *
 * Flow: createHypCheckoutPayment → customer pays at HYP UI → browser redirect
 *       → recordHypJ5Auth records the verified result
 */
export const createHypCheckoutPayment = functions.https.onCall(
	async (data: unknown, context) => {
		try {
			// Require Firebase Auth (anonymous users have UIDs; unauthenticated do not)
			const uid = context.auth?.uid;
			if (!uid) {
				return { success: false, error: "unauthenticated" };
			}

			const parsed = InputSchema.safeParse(data);
			if (!parsed.success) {
				logger.error("ledger.createHypCheckoutPayment.invalidInput", {
					uid,
					issues: parsed.error.issues,
				});
				return { success: false, error: "invalid_input" };
			}

			const { orderId, companyId, storeId, isJ5 } = parsed.data;

			// Load order server-side — never trust client-supplied order data
			const ordersPath = FirebaseAPI.firestore.getPath({
				companyId,
				storeId,
				collectionName: "orders",
			});
			const orderSnap = await admin.firestore().collection(ordersPath).doc(orderId).get();

			if (!orderSnap.exists) {
				logger.error("ledger.createHypCheckoutPayment.orderNotFound", {
					uid,
					companyId,
					storeId,
					orderId,
				});
				return { success: false, error: "order_not_found" };
			}

			const order = orderSnap.data() as TOrder;

			// Ownership check: order must belong to the caller.
			// Both anonymous and non-anonymous Firebase users have stable UIDs.
			// CheckoutPage sets order.userId = user.uid unconditionally, so this
			// comparison is safe for both user types.
			if (order.userId !== uid) {
				logger.error("ledger.createHypCheckoutPayment.ownershipMismatch", {
					uid,
					orderUserId: order.userId,
					orderId,
					storeId,
				});
				return { success: false, error: "forbidden" };
			}

			// Amount comes from the order loaded server-side, never from client input.
			// order.cart.cartTotal is in shekels (e.g. 150.50) — HYP expects shekels.
			const VAT_RATE = 18;
			const isVatIncluded = order.storeOptions?.isVatIncludedInPrice ?? false;
			const postVatPrice = (base: number, hasVat: boolean): number =>
				!isVatIncluded && hasVat ? base * (1 + VAT_RATE / 100) : base;

			const DELIVERY_NAME = "משלוח";
			const items = (order.cart.items ?? []).map((item) => {
				const price = postVatPrice(item.finalPrice ?? 0, !!item.product.vat).toFixed(2);
				const sku = (item.product.sku ?? "").trim();
				const name = (item.product.name[0]?.value ?? "").trim();
				return `[${sku}~${name}~${item.amount}~${price}]`;
			});
			if (order.cart.deliveryPrice) {
				items.push(`[0~${DELIVERY_NAME}~1~${order.cart.deliveryPrice.toFixed(2)}]`);
			}

			// Amount must equal HYP's own per-line sum of the heshDesc lines.
			const amountShekels = sumHeshDescItems(items);

			// Load store HYP credentials server-side
			const storePrivateSnap = await admin
				.firestore()
				.collection(`STORES/${storeId}/private`)
				.doc("data")
				.get();

			if (!storePrivateSnap.exists) {
				logger.error("ledger.createHypCheckoutPayment.missingStoreConfig", {
					uid,
					storeId,
				});
				return { success: false, error: "missing_store_config" };
			}

			const storePrivateData = storePrivateSnap.data() as TStorePrivate;

			// Call HYP to get a signed payment form
			const res = await hypPaymentService.createPaymentLink({
				action: "APISign",
				What: "SIGN",
				KEY: storePrivateData.hypData.KEY.trim(),
				PassP: storePrivateData.hypData.password.trim(),
				Masof: storePrivateData.hypData.masof.trim(),
				Sign: "True",
				Amount: amountShekels.toFixed(2),
				J5: isJ5 ? "True" : "False",
				MoreData: "True",
				Order: order.id,
				ClientName: order.nameOnInvoice ?? order.client?.displayName ?? "",
				ClientLName: "",
				email: order.client?.email ?? "",
				cell: order.client?.phoneNumber ?? "",
				street: order.client?.address?.street ?? "",
				city: order.client?.address?.city ?? "",
				UserId: "",
				phone: "",
				zip: "",
				Tash: "1",
				FixTash: "True",
				Info: order.id,
				UTF8: "True",
				UTF8out: "True",
				sendemail: "True",
				SendHesh: "True",
				heshDesc: items.join(""),
				Pritim: "True",
			});

			if (!res.success || !res.formAction || !res.formFields) {
				logger.error("ledger.createHypCheckoutPayment.hypFailed", {
					uid,
					orderId,
					storeId,
					errMessage: res.errMessage,
				});
				return { success: false, error: res.errMessage ?? "hyp_error" };
			}

			logger.info("ledger.createHypCheckoutPayment.success", {
				uid,
				orderId,
				storeId,
				companyId,
			});

			// Sanitize formFields before returning — strip any accidental credential
			// echoing from HYP. See sanitizeFormFields for full rationale.
			return {
				success: true,
				formAction: res.formAction,
				formFields: sanitizeFormFields(res.formFields),
			};
		} catch (err: unknown) {
			logger.error("ledger.createHypCheckoutPayment.error", { err });
			return { success: false, error: "internal" };
		}
	},
);
