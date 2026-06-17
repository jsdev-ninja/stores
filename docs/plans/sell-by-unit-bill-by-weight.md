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

---

# Full technical plan (for Philip)

> Requested by Philip on the PR. Owner's hard constraint stands: **do not change the J5 mechanism.** The one place this collides with reality is the checkout hold amount — called out explicitly in §5 as the single decision that needs you.

## Key insight — most of this already exists
A product priced per kg (`priceType.type === "kg"`) **already** flows through "estimate now, real weight later":
- Storefront stepper is **already whole-number only for every product** (`ProductCartButton.tsx` `InputButton`, +1/−1) — the comment there says weight products are corrected later by admin.
- `OrderEditModal.tsx` **already** treats any `priceType.type !== "unit"` line as a weight item (`isWeightItem`), gives it a **decimal** `QtyInput` (`WEIGHT_STEP=0.5`, `WEIGHT_MIN=0.01`), and recomputes `cart.cartTotal` via `fulfilledCost()` → `getCartCost()` on save.
- `getCartCost()` line total is `amount × finalPrice` (`packages/core/lib/utils/index.ts`) — unit-agnostic, so once `amount` holds the weighed kg, the total is correct.

So the new work is mostly **presentation** (how the customer reads it + how the document labels it) plus **one payment decision** (the checkout hold). The fulfillment + recompute path is already done.

## 1. Core schema — `@jsdev_ninja/core` (`Product.ts`), additive/optional
Keep `priceType.type === "kg"` (price stays per-kg; this is what already makes it a weight item at fulfillment). Add a presentation/billing flag:
```ts
pickByUnit: z.boolean().optional(),                 // true = customer picks whole units, billed by weight
avgUnitWeight: z.number().positive().optional(),    // kg per unit — only used to size the checkout hold (see §5)
```
Optional → existing products stay valid. Version bump + update consumers (`apps/store`, `functions`) to the new version.

## 2. Storefront presentation (no business-logic change)
- `ProductPriceType.tsx` — already renders `ל <unit> <value>` for non-unit products; format it as `₪4.90 לק״ג`. Add the `נמכר במשקל` badge near the title for `pickByUnit` products (e.g. in `DefaultProductCard.tsx`).
- Quantity stepper (`ProductCartButton.tsx` `InputButton`) — already whole numbers; for `pickByUnit` show the unit word inline (`3 יחידות`) and an explainer line. No behavioral change.
- Cart line (`cart-store.ts` view) — show `X יחידות · ₪4.90 לק״ג`. **No estimated price.**

## 3. Cart semantics
`amount` = unit count from the storefront, exactly like a kg product's rough estimate today. No change to `CartItemProductSchema` strictly required for billing; optionally add `actualWeight` later if you want to keep the original unit count for display alongside the weighed total. Recommended: **reuse `amount`** (count → weight at fulfillment) to match the existing kg flow and keep the diff small.

## 4. Fulfillment — already works
Admin opens `OrderEditModal` (or the picking page), the `pickByUnit` line is already a decimal weight item, enters the **total weighed kg** for the line, `fulfilledCost()` recomputes `cart.cartTotal`. Nothing new here beyond optionally labeling the input "ק״ג".

## 5. The one decision that needs you — the checkout hold (without touching J5)
Today the hold = `Σ(amount × price)` via `sumHeshDescItems()` (duplicated in `createHypCheckoutPayment.ts`, `createPayment.ts`, `chargeOrder.ts`). For a `pickByUnit` line that is `units × perKgPrice` — e.g. `3 × 4.90 = 14.70` — which is **far below** the real weighed total (≈ 3 melons × ~4kg × 4.90 ≈ 58). Because **J5 cannot capture above the hold**, the later capture of ~58 would exceed 14.70 and fail. This is the crux, and it's why the hold amount must be addressed even though J5 itself is untouched.

Options (your call):
- **(A) Hold by estimated weight.** Use `avgUnitWeight`: for `pickByUnit` lines, feed `units × avgUnitWeight × perKgPrice × (1+buffer)` into the existing hold computation. Capture later settles **down** to the real weight. Smallest behavioral change to J5 (none — only the number we ask it to hold), matches the "capture down" rule. **Recommended.**
- **(B) Send estimated weight as the line `amount` at checkout only**, then switch to the real weight at fulfillment. Keeps `sumHeshDescItems` untouched but splits "display amount" vs "checkout amount" — more confusing.
- **(C) Restrict `pickByUnit` to on-account (הקפה) customers**, who have no card hold (delivery note billed later). Zero payment risk, but excludes card customers.

If you pick (A), the only payment-side edit is computing the hold input for these lines — the J5 hold/capture code itself is unchanged.

## 6. Documents (`Invoice.tsx`, `DeliveryNote.tsx`)
Qty column currently renders bare `item.amount`. For a weighed line, render `4.30 ק״ג` (and the line total is already `price × amount`). Derive the unit suffix from `product.priceType.type` (or `pickByUnit`) at render time. Same change in both templates.

## 7. Cleanup opportunity
`sumHeshDescItems()` is copy-pasted in three files. If you touch the hold math (option A), consider centralizing it once.

## Phasing
- **Phase 1:** schema flag + storefront presentation + document labels. (Pure presentation; safe.)
- **Phase 2:** the checkout-hold decision (§5) wired in. (The only payment-touching part.)

## Open decisions for Philip
1. Hold strategy — A / B / C above.
2. Buffer size for option A (15% / 20%?).
3. Reuse `amount` for the weighed value (recommended) vs add `actualWeight` to keep the unit count too.
4. Centralize `sumHeshDescItems` while in there?
