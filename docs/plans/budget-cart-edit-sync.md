# Plan: keep B2B budget debt in sync when an admin edits an order's cart

**Status:** Not started — saved for later.
**Owner decision needed first:** Is editing a B2B (organization) order's cart *after* placement a real workflow? (e.g. picking adjustments in `AdminOrderPickPage`.) If **no** → do the cheap Option C and stop. If **yes** → do Option A.

---

## The bug

Budget debt is recorded **once**, at `order.placed` (`increaseDebtOnOrderPlaced` → `debt_increase = cartTotal` in agorot). Nothing re-syncs it when the cart changes afterward.

- `onOrderUpdate` (`functions/src/modules/orders/triggers/onOrderUpdate.ts`) only reacts to **status / paymentStatus transitions** and document attachments — it has **no branch** for `cart`/`cartTotal` changes.
- There is **no `order.updated` event**; order events are only `placed | cancelled | refunded` (`functions/src/modules/orders/events.ts`).
- The admin **does** edit carts and the total **is** recomputed: `AdminOrderPickPage.tsx:186` writes `cart.cartTotal: cartCost.finalCost`.
- `chargeOrder` captures the **current** (edited) `cartTotal`; the reversal subscriber reverses the **original** `debt_increase`. So debt, charge, and reversal all diverge.

### Failure scenarios (confirmed by code, not yet reproduced live)

| Edit | debt_increase (placement) | charge / reduction | Result |
|---|---|---|---|
| ₪50 → ₪40 (down) | 5000 | captures 4000 → reduction 4000 | `totalCurrentDebt = 1000` — customer shows owing ₪10 they don't owe, permanently |
| ₪40 → ₪50 (up) | 4000 | captures 5000 → reduction clamped to 4000 (`budget.reduction.clamped` logged) | debt → 0, but extra ₪10 collected is swallowed, never recorded as credit |
| edit, then cancel/refund | original amount | — | `reduceDebtOnOrderReversed` reverses the **original** debt_increase, not the net — reversal wrong too |

Only safe case today: an edit that leaves `cartTotal` unchanged.

---

## Option A — emit `order.updated`, adjust debt by the delta (correct, event-driven)

1. **`orders/events.ts`** — add `OrderEventTypes.updated = "order.updated"` + payload `{ orderId, organizationId, previousCartTotal, newCartTotal }`.
2. **`onOrderUpdate.ts`** — add a branch: `if (before.cart.cartTotal !== after.cart.cartTotal && after.organizationId)` → emit `order.updated`. Trigger has trustworthy server-side `before`/`after`, so the delta is authoritative (no re-read).
   - **Idempotency:** key the emitted event deterministically by the document version — `order_update_{orderId}_{after.updateTime}`. Re-deliveries of the same write share `updateTime` (dedupe to one); distinct edits get distinct keys. No UI/version-counter needed.
3. **New subscriber `budget/subscribers/adjustDebtOnOrderUpdated.ts`** — `deltaAgorot = round(new×100) − round(old×100)`:
   - **delta > 0** (edit up) → reuse existing `debt_increase` of the delta. **Zero new accounting logic** (existing `applyBudgetEvent` adds to `currentDebt` + `totalDebits`).
   - **delta < 0** (edit down) → the only new case (below).
4. **`applyBudgetEvent` + core `BudgetRecordType`** — add a downward-adjustment operation that decrements `currentDebt` **and** `totalDebits` by `|delta|` (NOT `totalCredits` — a smaller cart is not a payment). New enum value e.g. `debt_adjustment_decrease` in `@jsdev_ninja/core` `BudgetRecordSchema`.
5. **`reduceDebtOnOrderReversed.ts`** — change reversal to reverse the **net** of this order's records (sum of all `debt_increase` − adjustments for the order), not just the first `debt_increase`.
6. **Tests** — up / down / no-change, plus edge orderings below.

### Where the real cost is (design, not code volume)
- **Edit-down accounting:** existing model has only `debt_increase` (→ debits) and `debt_reduction` (→ credits). Reducing *debits* needs a new type — small core-schema enum add + one `applyBudgetEvent` branch. Edit-up is free.
- **Edit-after-payment ordering:** edit-up after charge → customer owes again (correct); edit-down after charge → clamps at 0 (handled). Reversal-after-edit must use the **net** (step 5).
- **Idempotency:** solved via `after.updateTime` (above).

**Difficulty: MEDIUM (~half a day + tests).** Low mechanical risk (mirrors existing increase/reduce subscribers); moderate design care for accounting correctness across edit↑/↓ × before/after payment × cancel.

---

## Option B — true-up at charge time
Reconcile debt to the actual captured amount inside the charge path. Simpler, but only fixes the charge flow — cancel/refund and uncharged-but-edited orders stay wrong. Not recommended as the sole fix.

## Option C — lock the cart after placement for B2B (cheap)
Block `cartTotal` changes on org orders (disable pick-edit for B2B, or reject in `onOrderUpdate`/the write path). **≈ 1 hour.** Eliminates the entire bug class with no accounting redesign. Best choice **if** B2B cart edits aren't a needed workflow.

---

## Recommendation
Decide the workflow question first. If B2B carts shouldn't change after placement → **Option C**. If they must → **Option A**. Avoid B as a standalone.

## Key files
- `functions/src/modules/orders/triggers/onOrderUpdate.ts`
- `functions/src/modules/orders/events.ts`
- `functions/src/modules/budget/subscribers/increaseDebtOnOrderPlaced.ts` (reference pattern)
- `functions/src/modules/budget/subscribers/reduceDebtOnOrderReversed.ts` (needs net-reversal change)
- `functions/src/modules/budget/services/applyBudgetEvent.ts`
- `packages/core/lib/entities/Budget.ts` (`BudgetRecordType` enum)
- `apps/store/src/pages/admin/Orders/AdminOrderPickPage.tsx` (where the cart is edited)
