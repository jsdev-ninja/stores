# Plan: simplified order approve flow

**Status:** Planned — not implemented.
**Goal (from owner):**
1. A newly created order is **always `pending`**.
2. Admin clicks **Approve** → order becomes **`completed`**, and branching on payment type:
   - `external` → **create a delivery note**
   - `j5` → **charge the order** (J5 capture)

This collapses today's multi-step flow (`pending → processing → in_delivery → delivered → completed`) into **`pending → [Approve] → completed`**.

---

## Current state (confirmed in code)

- **Order creation:** starts `status: "draft"` (`CheckoutPage.tsx:146`), then moves to `pending` after payment (`external` → `pending` immediately; `j5` → `pending` after the HYP redirect). `paymentStatus` starts `external` (for external) or `pending`.
- **Payment types:** `PaymentTypeSchema = ["external", "j5", "none"]`.
- **Admin actions** (frontend `appApi.admin`, direct Firestore writes): `orderAccept`→processing, `orderInDelivery`→in_delivery, `orderDelivered`→delivered, `endOrder`→`{status:"completed", paymentStatus:"completed"}`, `chargeOrder`→J5 capture callable, `cancelOrder`→cancelled.
- **Delivery note:** `completeOrder` (in `onOrderUpdate`, fires on `status → "completed"`) creates a DN **only when `paymentType === "external"`** (else skips — "HYP handles it").
- **Charge:** `chargeOrder` callable does the J5 capture → posts a ledger `hyp_capture` → `transaction_posted` → `markOrderPaidOnTransactionPosted` sets `paymentStatus: "completed"` + `reduceDebtOnTransactionPosted` lowers org debt.

**Good news:** the building blocks already exist. "Approve" mostly *composes* them.

---

## Target flow

### 1. Created → pending
Ensure order creation lands at `pending` (today it's `draft` → `pending` post-payment). Verify the checkout path always reaches `pending`; if "always pending on create" means *skip `draft`*, change `CheckoutPage.tsx:146` (+ the cart-draft path) to set `pending`. **Decision: is `draft` still needed (pre-payment cart) or removed entirely?**

### 2. Approve (single action on a `pending` order) — DECIDED
```
if (order.paymentType === "external") {
    // status → completed ONLY (do NOT touch paymentStatus — credit terms, still owed).
    // onOrderUpdate.completeOrder then auto-creates the delivery note.
    updateOrder(order.id, { status: "completed" })   // NOT endOrder() — that also marks paymentStatus
} else if (order.paymentType === "j5") {
    const res = await chargeOrder(order)              // J5 capture → ledger → paymentStatus completed, debt reduced
    if (res.success) updateOrder(order.id, { status: "completed" })  // no DN (completeOrder skips non-external)
} else { // "none" (free / no-payment)
    updateOrder(order.id, { status: "completed" })   // default: status only, no charge, no DN
}
```
- **external** (DECIDED): set **`status: "completed"` only** — leave `paymentStatus` as `external`/pending (customer still owes; budget/ledger tracks the debt, settled later via charge/manual/invoice). DN auto-created by `completeOrder`. ✓ **Do not use `endOrder()`** (it also sets `paymentStatus: "completed"`); use a status-only write.
- **j5** (DECIDED): charge first; only on success set `status: "completed"`. **No delivery note.**
- **none**: default to `status: "completed"` only (no charge, no DN) — confirm if a different behavior is wanted.

---

## Implementation options

**Option A — frontend-orchestrated (fastest, matches current pattern).**
Add an `approveOrder({ order })` helper (in `appApi.admin` or the modal) that branches on `paymentType` and calls the existing `chargeOrder` / status-write methods. The order-admin methods are already client-side Firestore writes, so this is consistent. Wire the **Approve** button in `OrderDetailsModal` + the orders list to it.

**Option B — backend `approveOrder` callable (cleaner, recommended long-term).**
One callable does the branch server-side (auth-checked, single source of truth, atomic, not dependent on the open client writes). More work; better once Firestore is locked down.

→ **Recommendation:** Option A now (ship the flow), migrate to B when Firestore rules land.

---

## UI changes
- **OrderDetailsModal + orders list:** for a `pending` order, the primary action becomes **"אשר" (Approve)** (replacing accept/on-delivery/delivered). Keep **Cancel**. Label can mirror the demo (`✓ אשר`).
- Hide the intermediate-step buttons (processing/in_delivery/delivered) — they're not part of the new flow.
- Keep the status enum values (`processing`, `in_delivery`, `delivered`) for backward-compat with existing orders; just stop *driving* them.

---

## Decisions
1. **`external` approve → `status: completed` only; `paymentStatus` left unpaid.** ✅ DECIDED — payment settled later via charge/manual/invoice; budget/ledger tracks debt. Use a status-only write (NOT `endOrder`).
2. **`j5` → no delivery note**, charge only. ✅ DECIDED.
3. **`paymentType: "none"`** → default `status: completed` only (no charge, no DN). ⚠️ confirm if different.
4. **`draft` status** → keep as the pre-payment cart state; orders reach `pending` after the payment step (owner point 1 satisfied). ⚠️ confirm whether to drop `draft` entirely.
5. **Idempotency / trigger safety** — `external` DN creation via `onOrderUpdate.completeOrder` is solid; re-approve is safe (`createDeliveryNote` skips if `order.deliveryNote` already exists). ✅

---

## Key files
- `apps/store/src/appApi/index.ts` — order-admin methods (`chargeOrder`, `endOrder`, `orderAccept`, `cancelOrder` …) — add `approveOrder` here (Option A).
- `apps/store/src/widgets/Modals/OrderDetailsModal.tsx` — wire the Approve button.
- `apps/store/src/pages/admin/Orders/AdminOrdersPage.tsx` — orders-list action.
- `functions/src/modules/orders/triggers/onOrderUpdate.ts` + `services/completeOrder.ts` — DN-on-completed (external).
- `functions/src/modules/payments/api/chargeOrder.ts` — J5 capture.
- `apps/store/src/pages/store/CheckoutPage/CheckoutPage.tsx` — order-creation status (point 1).
