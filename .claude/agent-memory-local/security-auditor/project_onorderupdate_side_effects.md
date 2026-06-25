---
name: project-onorderupdate-side-effects
description: The onOrderUpdate Firestore trigger fires completeOrder/cancelOrder/refundOrder on bare Order.status transitions — money side-effects, not inert
metadata:
  type: project
---

`functions/src/modules/orders/triggers/onOrderUpdate.ts` runs side-effecting services on status transitions of any order write:
- `before.status !== "completed" && after.status === "completed"` → `completeOrder(...)`
- `... === "cancelled"` → `cancelOrder(...)`
- `... === "refunded"` → `refundOrder(...)`

So a "bare field set" of `Order.status` is NOT side-effect-free — it can trigger refunds/cancellation/invoicing flows (HYP/EZcount/ledger).

**Why:** This is exactly why the super-admin console's E1 `saSetOrderStatus` callable was correctly deferred/not deployed (it would have fired refunds). The frontend still ships an `saSetOrderStatus` wrapper + form, but the backend callable is not exported, so it currently no-ops at runtime.

**How to apply:** Any future feature, script, or admin action that writes `Order.status` must account for these triggers. A status edit is never "just a field." If E1 is ever implemented, it needs an explicit decision on whether to allow/guard the completed/cancelled/refunded transitions, and the frontend wrapper must not be wired until the backend re-check lands.
