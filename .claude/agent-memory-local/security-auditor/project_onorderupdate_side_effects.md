---
name: project-onorderupdate-side-effects
description: The onOrderUpdate Firestore trigger fires completeOrder/cancelOrder/refundOrder on bare Order.status transitions — money side-effects, not inert
metadata:
  type: project
---

`functions/src/modules/orders/triggers/onOrderUpdate.ts` fires side-effects on status transitions of any order write. As of 2026-06-26 it was refactored from calling `orderService.complete/cancel` DIRECTLY to **emitting events** instead:
- `before.status !== "completed" && after.status === "completed"` → emits `order.completed` (payload: orderId, paymentType)
- `... === "cancelled"` → emits `order.cancelled`
(No `→ refunded` branch in the current trigger; refund side-effects live elsewhere — re-grep if it matters.)

Downstream subscribers on `order.completed`: `chargeJ5OnOrderCompleted` (j5 charge) and `createDeliveryNoteOnOrderCompleted` (external → delivery note → B2B AR accrual, see [[ar-money-path-idempotency]]). So a "bare field set" of `Order.status` is STILL NOT side-effect-free — it now asynchronously triggers charges/DN/AR via the event bus.

**Why:** This is exactly why the super-admin console's E1 `saSetOrderStatus` callable was correctly deferred/not deployed (it would have fired refunds). The frontend still ships an `saSetOrderStatus` wrapper + form, but the backend callable is not exported, so it currently no-ops at runtime.

**How to apply:** Any future feature, script, or admin action that writes `Order.status` must account for these triggers. A status edit is never "just a field." If E1 is ever implemented, it needs an explicit decision on whether to allow/guard the completed/cancelled/refunded transitions, and the frontend wrapper must not be wired until the backend re-check lands.
