# Plan: sell by unit, bill by actual weight

**Status:** Planned — not implemented. Awaiting Philip's approval (core schema + payment-capture change). Requested by David (owner).

**Goal:** Produce like watermelon, melon, cabbage is **chosen by the customer in whole units**, but **billed by the actual weighed weight** captured in the store at fulfillment. The customer never types a weight and never sees an estimated price; the final price on the card and on the invoice is the real weighed total.

---

## Customer experience (agreed with David)

The customer side is **units only** — there is no weight input anywhere for the shopper. The number they pick is always a count of items. The weight is entered later by store staff at weighing.

**1. Product card**
- Badge: **נמכר במשקל**.
- Price line: `₪4.90 לק״ג · מחיר סופי לפי שקילה`.
- Quantity selector shows the unit word glued to the number — `3 יחידות`, never a bare `3`.
- One-line explainer: *"בוחרים כמה אבטיחים רוצים. כל אבטיח נשקל בנפרד, והתשלום לפי המשקל בפועל."*

**2. Cart line**
- Repeats the message: `אבטיח · 3 יחידות · נשקל · ₪4.90 לק״ג`.

**3. Checkout (credit-card / J5 customers)**
- *"מאחר שהמוצר נשקל, נבצע תפיסת מסגרת זמנית בכרטיס. החיוב בפועל יתבצע רק לאחר השקילה, לפי המשקל המדויק."*

**4. Order confirmation**
- *"הסכום הסופי יעודכן לאחר שקילת המוצרים הנשקלים, ויישלח אליך בחשבונית."*

**5. Invoice / delivery note**
- The weighed item appears in the **same table and format** as every other product — no special styling. The only difference: the "כמות" column shows the weight (e.g. `4.30 ק״ג`) and the line total is `weight × price-per-kg`.

Design principle: never show a bare number; always attach "יחידות" on the customer side and "ק״ג" on the document side, so units and weight never collide in one field.

---

## Payment — rides on the existing J5 flow (key finding)

The store already uses **HYP J5 pre-authorization**, and the existing capture infrastructure already supports capturing a **different (lower) amount** than was held. This makes the feature small and low-risk on the payment side.

**Credit-card customers (`paymentType: "j5"`):**
1. Checkout places a J5 **hold** (`createHypCheckoutPayment` sets `J5:"True"`).
2. Store weighs each item and enters the actual weight.
3. On approval, **capture the real weighed total** (≤ hold) and release the surplus.

The hold amount is computed from **average unit weight + a safety buffer (~15–20%)**, so the real weighed total almost always falls *inside* the hold. This is deliberate because of the J5 rule below.

**On-account customers (הקפה, `paymentType: "external"`):**
- No payment at order time — delivery note now, billed later by the real weighed total. **No change needed; works today.**

### Hard J5 constraint
A J5 capture can **never** charge more than was authorized. That is exactly why we hold `avg + buffer` and only capture *downward* to the real weight. Capturing down always works; capturing up does not.

> **Related existing-behavior question flagged separately** (David raised it): when an admin **adds items** to an order after the J5 hold, the active capture path (`captureHypJ5.ts`) appears to capture the **original** authorized amount, so items added above the hold may not be collected. This is a pre-existing concern, not introduced by this feature, but it shares the same root constraint — see "Open decisions".

---

## Current state

- **Product** (`packages/core/lib/entities/Product.ts`): has `priceType { type: "unit"|"kg"|"gram"|"liter"|"ml", value }` and an informational `weight { value, unit }`. There is **no** "sold by unit, billed by weight" mode and **no** average-unit-weight used for pricing/hold.
- **Pricing**: line total is always `amount × price` (`getCartCost` / `sumHeshDescItems`). `amount` is whole for unit products, fractional for weight products. No weight factor beyond that.
- **J5**: `createHypCheckoutPayment` (hold), `recordHypJ5Auth` (record auth), `captureHypJ5` (capture — currently forces `actualAmount === originalAmount`), legacy `chargeOrder` (can send a different current-items total). `hypPaymentService.chargeJ5Transaction` already takes separate `originalAmount` / `actualAmount`.
- **Order** (`Order.ts`): `originalAmount` / `actualAmount` fields exist but are not populated through this flow today.
- **Documents**: `Invoice.tsx` / `DeliveryNote.tsx` render `amount` with no unit label.
- **Admin edit** (`OrderEditModal.tsx`): already supports decimal-weight entry per line and recomputes `cart.cartTotal`.

---

## Changes

### 1. Core schema (`@jsdev_ninja/core` — `Product.ts`) — additive, backward-compatible
Add an explicit mode + the average unit weight used to size the J5 hold:
```ts
// "unit" = today's behavior; "unit_billed_by_weight" = pick units, charge by weighed weight
sellMode: z.enum(["unit", "unit_billed_by_weight"]).optional(), // default "unit"
avgUnitWeight: z.object({ value: z.number().positive(), unit: z.enum(["kg", "gram"]) }).optional(),
```
`priceType.type` stays `"kg"` for these products (price is per-kg); `sellMode` is what flips the UI to a unit picker and the billing to weight.

### 2. Cart item (`Cart.ts`) — capture the weighed result
Add to `CartItemProductSchema` (optional → backward-compatible):
```ts
actualWeight: z.number().positive().nullable().optional(), // entered at weighing, per the line
```

### 3. Storefront UI
- Product card + cart: unit picker (whole numbers), `נמכר במשקל` badge, per-kg price, explainer copy (above).
- No estimated price shown to the customer.

### 4. J5 hold sizing
At checkout, for `sellMode === "unit_billed_by_weight"` lines, size the hold contribution as
`units × avgUnitWeight × pricePerKg × (1 + buffer)`; other lines unchanged.

### 5. Weighing → final capture
- At fulfillment (reuse the existing decimal-weight entry in `OrderEditModal` / picking), store `actualWeight` per line and recompute the line total as `actualWeight × pricePerKg`.
- Capture the recomputed (real) total via `captureHypJ5`, wiring `actualAmount` = real total (≤ hold) instead of forcing it equal to the hold.

### 6. Documents
- `Invoice.tsx` / `DeliveryNote.tsx`: for weighed lines, show the weight in the quantity column (`4.30 ק״ג`) and `weight × price-per-kg` as the total — identical formatting to other lines.

---

## Open decisions
1. **Core schema change OK?** Additive/optional and backward-compatible, but it lives in `@jsdev_ninja/core`, so it needs the version bump + all consumers (`apps/store`, `functions`) green.
2. **Buffer size** for the J5 hold (15%? 20%?) — trade-off between rejected cards and over-holding.
3. **Capture path:** wire `captureHypJ5` to capture the real (lower) weighed amount. Confirm this is the live path and that legacy `chargeOrder` is retired, so behavior is unambiguous.
4. **Pre-existing "added items above hold" gap** — fix together with this (cap-aware capture / top-up) or keep separate? (Flagged for investigation.)
5. **avgUnitWeight source** — entered per product in admin, or a sensible default per category?

## Key files
- `packages/core/lib/entities/Product.ts` — `sellMode`, `avgUnitWeight`
- `packages/core/lib/entities/Cart.ts` — `CartItemProductSchema.actualWeight`
- `packages/core/lib/utils/index.ts` — `getCartCost` / weighed line total
- `apps/store/src/...` product card + cart — unit picker + copy
- `functions/src/modules/ledger/api/createHypCheckoutPayment.ts` — hold sizing
- `functions/src/modules/ledger/api/captureHypJ5.ts` — capture real weighed amount
- `functions/src/services/hypPaymentService/index.ts` — `chargeJ5Transaction(originalAmount, actualAmount)`
- `apps/store/src/widgets/Modals/OrderEditModal.tsx` — actual-weight entry at fulfillment
- `functions/src/services/documents/templates/{Invoice,DeliveryNote}.tsx` — weighed-line display
