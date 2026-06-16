# Plan: sell by unit, show price per kg, bill by actual weight

**Status:** Planned — not implemented. Awaiting Philip's approval. Requested by David (owner).

> This doc was rewritten to match exactly what David asked for. Earlier drafts prescribed payment/J5 changes — **ignore those**. See "Payment" below: the existing J5 flow is **not** to be touched.

**Goal:** Produce like watermelon, melon, cabbage that the customer **chooses in whole units**, with the **price shown per kg**, and is **billed by the actual weighed weight** entered in the store at fulfillment.

---

## What David confirmed he wants

**1. Customer picks by units, price shown per kg** (this is the core ask)
- Quantity selector is whole **units** only — `− 3 יחידות +`. The unit word is glued to the number, never a bare `3`. No weight field for the customer.
- Price is displayed **per kg**: `₪4.90 לק״ג`.
- Small badge on the product: **נמכר במשקל**.
- **No estimated price** is shown to the customer.

(Reference mockup David approved: watermelon card — `נמכר במשקל` badge, `₪4.90 לק״ג`, and a `− 3 יחידות +` unit stepper.)

**2. Cart line** — same message repeated: `אבטיח · 3 יחידות · ₪4.90 לק״ג`.

**3. Invoice / delivery note** — the weighed item appears in the **same table and format** as every other product, no special styling. The only difference: the "כמות" column shows the actual weight (e.g. `4.30 ק״ג`) and the line total is `weight × price-per-kg`.

Design principle: never show a bare number — "יחידות" on the customer side, "ק״ג" on the document — so units and weight never collide in one field.

---

## Payment — DO NOT change the existing J5 flow

David's instruction: **leave the current payment/J5 flow exactly as it is.** This feature must not modify J5 hold/capture behavior.

Open question for Philip (NOT to be decided by the owner): for a product that the customer picks by units but is priced per kg, what amount should the order/charge use at checkout, given the final amount is only known after weighing? This needs Philip's call on the cleanest way to fit it to the current flow — this doc does not prescribe a solution.

On-account (הקפה) customers are unaffected either way: it's a delivery note, billed later by the real weighed total.

---

## Current state (for Philip)

- **Product** (`packages/core/lib/entities/Product.ts`): has `priceType { type: "unit"|"kg"|... , value }` and an informational `weight { value, unit }`. No "pick by unit, price per kg, bill by weight" mode today.
- **Pricing**: line total is always `amount × price` (`getCartCost` / `sumHeshDescItems`). For a unit pick at a per-kg price this would mis-compute — part of the open question above.
- **Documents**: `Invoice.tsx` / `DeliveryNote.tsx` render `amount` with no unit label.
- **Admin edit** (`OrderEditModal.tsx`): already supports decimal-weight entry per line and recomputes `cart.cartTotal` — likely where the actual weighed weight gets entered.

---

## What this needs (high level, for Philip to scope)

1. A way to mark a product as **"pick by units, price per kg, bill by weight"** (small additive flag on `Product` in `@jsdev_ninja/core`).
2. Storefront: unit picker + per-kg price + `נמכר במשקל` badge + cart copy (no estimated price).
3. A place to enter the **actual weight** per line at fulfillment (the order-edit / picking screen already does decimal weights).
4. Invoice / delivery note: show the weight in the quantity column for these lines, same format as the rest.
5. Decide how this fits the existing payment flow **without changing J5** (the open question above).

## Open decisions (for Philip)
1. Additive `@jsdev_ninja/core` schema change → version bump + consumers (`apps/store`, `functions`) green.
2. How the checkout/charge amount is determined for these products, fitting the existing J5 flow as-is.

## Key files
- `packages/core/lib/entities/Product.ts` — product flag
- `packages/core/lib/utils/index.ts` — `getCartCost` / weighed line total
- `apps/store/src/...` product card + cart — unit picker + per-kg price + copy
- `apps/store/src/widgets/Modals/OrderEditModal.tsx` — actual-weight entry at fulfillment
- `functions/src/services/documents/templates/{Invoice,DeliveryNote}.tsx` — weighed-line display
