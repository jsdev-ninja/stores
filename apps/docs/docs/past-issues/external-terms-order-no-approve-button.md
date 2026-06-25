---
sidebar_position: 4
title: External-terms order has no "approve → delivery note" button
---

# External-terms order has no "approve → delivery note" button

| | |
|---|---|
| **Store** | Balasi (balasistore) — store is **not** globally `external` |
| **Affected customers** | Any customer/organization whose **own** `paymentType === "external"** (credit-terms B2B) — **not store-wide** |
| **Status** | 🔎 Root cause found · one-line fix proposed below · **awaiting Philip's approval** (touches checkout payment-status logic) |
| **Reported by** | David (app owner), order `AzCLghN46jKLip66FeFs`, 26 Jun 2026 |

## In one line

For a customer on **external payment terms**, the order-details modal shows **no
"✓ אשר → תעודת משלוח"** (approve → delivery note) button, so the admin can never
approve the order and the delivery note is never created.

## The symptom

In the order-details modal the admin sees only: cancel, create-payment-link, edit,
picking-status, close — **but not the approve button** — even though the order is
clearly a credit-terms order (`אופן תשלום: external`, status `pending`).

## Root cause — `paymentType` and `paymentStatus` disagree

The approve button is gated on **`paymentStatus`**, but the value is stamped from a
**different (narrower) condition** than the one that stamps **`paymentType`**.

**1. The gate** — [`OrderDetailsModal.tsx:39`](../../../apps/store/src/widgets/Modals/OrderDetailsModal.tsx) /
[`:225`](../../../apps/store/src/widgets/Modals/OrderDetailsModal.tsx):

```ts
const APPROVABLE_PAYMENT_STATUSES = ["pending_j5", "completed", "external"];
// ...
if (order.status === "pending" && APPROVABLE_PAYMENT_STATUSES.includes(order.paymentStatus ?? "")) {
  // render "✓ אשר → תעודת משלוח"
}
```

So the button needs **`order.paymentStatus === "external"`** (for the credit-terms case).

**2. Where the order is created** — [`CheckoutPage.tsx`](../../../apps/store/src/pages/store/CheckoutPage/CheckoutPage.tsx):

```ts
// line 238 — paymentSTATUS keys ONLY off the store:
paymentStatus: store.paymentType === "external" ? "external" : "pending",

// lines 272–288 — paymentTYPE keys off store OR org OR profile:
if (
  store.paymentType === "external" ||
  profileOrganization?.paymentType === "external" ||
  profile?.paymentType === "external"
) {
  newOrder.status = "pending";
  newOrder.paymentType = "external";   // ← type corrected to "external"
  await appApi.orders.order({ order: newOrder });   // paymentStatus still "pending"
  return;
}
```

**The mismatch:** when only the **organization/profile** is external (store is not),
the order gets `paymentType: "external"` (line 278) but `paymentStatus` was already
set to `"pending"` at line 238 and is **never corrected** inside the external branch.

Result for Balasi's credit-terms customers:

| field | value | correct? |
|---|---|---|
| `order.paymentType` | `"external"` | ✅ |
| `order.paymentStatus` | `"pending"` | ❌ should be `"external"` |

`"pending"` is **not** in `APPROVABLE_PAYMENT_STATUSES` → approve button hidden →
delivery note never created. The delivery-note creation itself is fine: once the
order reaches `completed`, [`completeOrder.ts`](../../../functions/src/modules/orders/services/completeOrder.ts)
creates the delivery note for `paymentType === "external"`. The order just never
*gets* to `completed` because the admin can't approve it.

## Proposed fix (one line)

Inside the external branch in `CheckoutPage.tsx` (right next to `newOrder.paymentType = "external"`),
also correct the status so it matches the type:

```ts
  newOrder.status = "pending";
  newOrder.paymentType = "external";
  newOrder.paymentStatus = "external";   // ← add this: keep status consistent with type
```

This sets `paymentType` and `paymentStatus` from the **same** condition (store OR org
OR profile external), which is exactly the intent. The approve button then appears
for every credit-terms order and the existing approve → `completeOrder` →
delivery-note flow takes over unchanged.

## Risk

- **Low / contained.** Only affects the checkout branch already chosen for external
  orders (it does not run for J5/card orders — those return at line 290). It only
  changes a field that is otherwise left at a wrong default.
- No schema change, no `@jsdev_ninja/core` bump, no backend change.
- No migration of existing stuck orders is included — see below.

## Sibling code worth checking (same pattern, not changed here)

The admin "create order" paths use the **same store-only condition** for
`paymentStatus`, so an admin-created order for a credit-terms customer in a
non-external store would have the same mismatch:

- [`useAdminCreateOrderModal.ts:135`](../../../apps/store/src/widgets/Modals/useAdminCreateOrderModal.ts)
- [`AdminCreateOrderPage.tsx:143`](../../../apps/store/src/pages/admin/AdminCreateOrderPage/AdminCreateOrderPage.tsx)

If admin-created external orders should also be approvable, these two should adopt the
same org/profile-aware condition. (Left out of the minimal fix — Philip to decide
scope.)

## Still open / worth watching

- **Existing stuck orders** (already created with `paymentType: external` +
  `paymentStatus: pending`, e.g. `AzCLghN46jKLip66FeFs`) won't be fixed by the code
  change — they need a one-off field correction (`paymentStatus → "external"`) or a
  small backfill. Recommend listing & patching them once the fix is approved.
- Consider a single shared helper `isExternalOrder({ store, org, profile })` so the
  status and type can never drift apart again across the three call sites.
