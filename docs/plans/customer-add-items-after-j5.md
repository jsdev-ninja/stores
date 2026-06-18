# Plan: let the customer add items to an order after it's already in J5 hold

**Status:** Spec — awaiting Philip's approval before any implementation.
**Requested by:** David (owner). **Chosen approach:** Option A — re-authorize a fresh J5 hold on the full updated total, so the order ends up with a single clean charge.

> **למה זה כאן (סיכום לבעלים):** לקוח סיים הזמנה, הזין כרטיס אשראי ונכנס להמתנת J5 — ואז נזכר שהוא רוצה להוסיף עוד מוצרים. המסמך הזה מתאר איך לאפשר לו להוסיף בעצמו, בלי להתחיל הזמנה חדשה, ובלי שניים חיובים. הבנייה נוגעת בלוגיקת תשלום/J5 ולכן דורשת מימוש ואישור של פיליפ.

---

## The scenario

1. Customer checks out → `createHypCheckoutPayment` builds a signed J5 form for `order.cart.cartTotal`.
2. Customer enters card on the HYP UI → J5 **authorization (hold)** is taken for that amount.
3. Browser redirects to `OrderSuccessPage` → `appApi.system.onOrderPaid(...)` → `recordHypJ5Auth` writes a `hyp_j5_auth` ledger transaction. Order is now in J5-pending state, **money has not moved**.
4. Admin later picks/edits and runs `chargeOrder`, which captures the **current** (picked) order total via `hypPaymentService.chargeJ5Transaction` (`Amount = picked total`, `inputObj.originalAmount = the J5 hold amount`).

**The gap:** between steps 3 and 4 there is no way for the *customer* to add items. The order is frozen from the customer's side. We want to reopen it — while still in J5 hold, before capture — so the customer can add products and the final single charge reflects the new total.

## Why a fresh J5 (Option A) and not "just charge more on the existing hold"

The existing capture path (`chargeOrder`) already sends `Amount = current order total`, which can be **higher** than the original hold. The open risk is whether HYP / the issuer honors capturing meaningfully **above** the authorized J5 amount — J5 in grocery is normally used to capture **≤** the held estimate (final weight ≤ estimate). Capturing well above the hold may be declined or tolerance-capped.

Option A sidesteps this entirely: when the customer adds items we **void/replace the old hold and take a brand-new J5 hold for the new full total**, so capture is always ≤ the (new) hold. No reliance on over-capture tolerance.

**→ Open question for Philip #1:** Confirm HYP's behavior/limit for capturing above a J5 hold. If it's freely allowed up to some headroom, a lighter variant (no re-auth, just edit the cart) becomes possible. Option A assumes it is NOT safe to rely on.

---

## Proposed flow (Option A)

### A. Entry point (customer UI)
- On `OrderSuccessPage` (and/or the customer order-details view), show **"הוסף מוצרים להזמנה"** — visible **only while** the order is eligible (see guard below).
- Clicking returns the customer to the store to shop. Items accumulate into a cart bound to this existing `order.id` (reopen the order's cart rather than starting a new order).

### B. Update the order cart
- On "checkout again", merge the new items into `order.cart`, recompute `cartTotal`/`cartVat`/`deliveryPrice` the same way the original checkout does. This is the existing order entity — no schema change.

### C. Re-authorize J5 for the new full total
- Call `createHypCheckoutPayment` again for the same `orderId` (it already reads `order.cart` server-side and builds a J5 form for the current total — **it works as-is for the new total**).
- Customer re-enters card on the HYP UI for the new total → redirect → `recordHypJ5Auth` records a **new** `hyp_j5_auth` (new HYP `Id` → new dedup key `hyp_{Id}`, so it inserts cleanly alongside the old one).
- **Void / supersede the old hold** so capture targets the new auth (see open questions #2 + #3).

### D. Capture (unchanged)
- Admin runs `chargeOrder` → captures the new total against the new hold. Already works.

---

## What needs to change (for Philip to scope)

1. **Customer can't currently reopen/edit a placed order.** Need a customer-facing "add items" entry that rebinds the store cart to the existing `order.id` and updates `order.cart`. (New client flow; the admin `OrderEditModal` is admin-only and not reusable here.)

2. **Two `hyp_j5_auth` transactions per order after re-auth.** Capture must deterministically pick the **latest valid** auth:
   - `chargeOrder` reads `payments/{orderId}` and charges off `payment.payment.UID/Id/ACode`. The re-auth must **overwrite `payments/{orderId}`** with the new auth's fields, or capture will use the stale hold.
   - `captureHypJ5` (the newer ledger path) takes a `j5TransactionId` explicitly and charges `authTx.amount` (the held amount, locked) — if this path is ever used here it must be pointed at the **new** auth tx, and the old `hyp_j5_auth` should be marked superseded so it can't be captured.

3. **Void the old hold.** Confirm whether HYP exposes a J5 void/cancel. If yes → void the old hold on successful re-auth. If no → the old hold auto-expires in a few days; document that the customer may briefly see two pending holds (no double **charge**, since only capture moves money). **→ Open question for Philip #2.**

4. **Eligibility guard (hard).** Allow add-items only when ALL hold:
   - `paymentStatus` is the J5-pending state (not `completed`/`refunded`/`failed`),
   - no `hyp_capture` exists yet for the order (reuse the `queryCaptursByAuthTx` guard idea),
   - order status not advanced past pending (not `processing`/`in_delivery`/`delivered`/`cancelled`),
   - within the J5 hold validity window (holds expire). **→ Open question for Philip #3:** what expiry window does this store's masof use?

5. **B2B budget/debt reconciliation.** For organization orders, `increaseDebtOnOrderPlaced` recorded debt at the **original** total. Changing the total here hits the exact gap documented in [`budget-cart-edit-sync.md`](./budget-cart-edit-sync.md). Either scope this feature to **retail (non-org) orders only** for v1, or land Option A from that plan first. **→ Owner/Philip decision.**

6. **Concurrency / race.** Customer adding items while an admin is picking the same order. Need a simple lock or last-writer guard so the two carts don't clobber each other.

---

## Risks

- **Payment correctness** (core financial) — re-auth + void + capture-targeting must be exactly right or a customer is double-held, under-charged, or charged against a stale hold.
- **B2B accounting drift** — see #5; do not ship for org orders until reconciled.
- **Friction** — re-entering the card for the new total. Acceptable for v1; a future improvement could reuse the saved HYP token to re-auth without re-entry (larger scope).

## Smallest safe v1

Retail orders only · J5-pending + not captured + within window · re-auth full total · overwrite `payments/{orderId}` · void old hold if HYP supports it, else let it expire. Org orders and token-reuse (no re-entry) are follow-ups.

---

## Files in play (reference)

- `functions/src/modules/ledger/api/createHypCheckoutPayment.ts` — builds the J5 form for the current order total (reusable for re-auth).
- `functions/src/modules/ledger/api/recordHypJ5Auth.ts` — records each `hyp_j5_auth` (dedup `hyp_{Id}`).
- `functions/src/modules/ledger/api/chargeOrder.ts` — capture path; charges current total, reads `payments/{orderId}`.
- `functions/src/modules/ledger/api/captureHypJ5.ts` — newer capture path; charges the locked `authTx.amount`.
- `functions/src/services/hypPaymentService/index.ts` — `chargeJ5Transaction` (`Amount` vs `originalAmount`), and where a J5 void would live.
- `apps/store/src/pages/store/OrderSuccessPage/OrderSuccessPage.tsx` — customer landing after J5; natural home for the "add items" entry.
- `functions/src/modules/budget/...` + `docs/plans/budget-cart-edit-sync.md` — B2B debt reconciliation dependency.
