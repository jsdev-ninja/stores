# Plan: VIP company pricing — per-product VIP price + working company discount

**Status:** Proposed — needs Philip's approval. Requested by David (owner).
**Trigger:** Owner wants VIP customers to get **different prices per product** (not just a
flat percentage discount). This doc translates the agreed behaviour into an implementation
spec so Philip can scope/approve it.

> ⚠️ Owner-restricted feature. Touches the `Product` + `Organization` schemas
> (`@jsdev_ninja/core`) and the **central price calculation** (`getCartCost`) →
> **cannot ship without developer sign-off** per CLAUDE.md.

---

## Goal (agreed with owner)

1. A company can be flagged **VIP**. There is **one** VIP tier (no silver/gold for now).
2. A product can carry an **optional VIP price** alongside its normal price.
3. The store is **B2B only** — there are no private customers, so VIP is always at the
   **company (Organization)** level. No per-user pricing.
4. The existing per-company **percentage discount** must be made to **actually work**
   (today it is stored and displayed but never applied — see "Current state").
5. The VIP price must be enterable in the **supplier-invoice (תעודת מלאי) flow** with a live
   **VIP profit %** column, so the owner sees the margin on the VIP price as cost changes.

### Agreed pricing rules (the decision table)

For a given product and a given company, the price the customer pays is decided like this:

1. **Base for the company** = the **lower** of (public price *after any site sale/discount*)
   and (the product's VIP price, if set). → *A VIP never pays more than a regular shopper.*
2. **Company percentage discount** applies **on top of the VIP price**, BUT **does not stack
   on top of a site sale**. I.e. the company discount is applied only when the chosen base is
   the VIP/regular price, **not** when the chosen base is a site-sale price.
3. **Safety floor:** the final price is **never below the product's purchase price**
   (`purchasePrice`). If a discount/sale would push it lower, clamp to the floor.

Worked examples (company has a 5% discount, product purchasePrice ₪70):

| Site price (after sale) | VIP price | Rule picks base | Company 5% applies? | Final |
| ----------------------- | --------- | --------------- | ------------------- | ----- |
| ₪100 (no sale)          | ₪85       | VIP ₪85         | yes → ₪80.75        | ₪80.75 |
| ₪90 (small sale)        | ₪85       | VIP ₪85         | yes → ₪80.75        | ₪80.75 |
| ₪79 (big sale)          | ₪85       | sale ₪79        | **no** (it's a sale) | ₪79   |
| ₪75 (deep sale)         | ₪85       | sale ₪75        | no                  | ₪75 (floor ₪70 not hit) |
| ₪68 (extreme sale)      | ₪85       | sale ₪68        | no                  | **₪70** (clamped to floor) |

---

## Current state (confirmed in code)

- **`Product` schema** (`packages/core/lib/entities/Product.ts`): has `price`,
  `purchasePrice?`, `profitPercentage?`, `discount {type, value}` (the site sale/discount),
  `priceType`, `currency`. **No** VIP price field today.
- **`Organization` schema** (`packages/core/lib/entities/Organization.ts:15`): already has
  `discountPercentage?` (0–100) and `groupId?`. So a per-company discount field **exists**.
- **The company discount is never applied.** `discountPercentage` appears only in admin UI /
  order-creation display (`AdminOrganizationsPage`, `AdminOrderPageNew`, `AdminCreateOrderPage`,
  `AdminClientProfile`, `CreateInvoiceModal`). It is **not** referenced in the price engine.
- **Central price calc** lives in `getCartCost()` (`packages/core/lib/utils/index.ts:36`).
  Per item it sets `finalPrice = getPriceAfterDiscount(product, isVatIncludedInPrice)` — i.e.
  base `product.price` minus the product-level `discount` only. **No company / VIP input.**
  This is the single place the new logic must hook into.
- **Margin helpers already exist** (`packages/core/lib/utils/storeCalculator/storeCalculator.ts`):
  `calcMarginFromSalePrice(salePrice, purchasePrice)` and
  `calcSalePriceFromMargin(margin, purchasePrice)`. The VIP profit % column reuses these — no
  new math needed.
- **Supplier-invoice entry** (`apps/store/src/pages/admin/AdminInventoryCertificatePage.tsx`)
  already has per-row `purchasePrice / profitPercentage / price` with live auto-calc and an
  old-vs-new confirmation modal. The `SupplierInvoice` schema
  (`packages/core/lib/entities/SupplierInvoice.ts`) + its create trigger
  (`functions/src/modules/suppliers/triggers/supplierInvoice.ts`) batch-update product prices.
  VIP price/margin slot naturally into this row + the `productsToUpdate` writeback.

**Takeaway:** the data model and the margin math mostly exist. The real work is (a) two new
schema fields, (b) wiring the **company discount + VIP price into `getCartCost`** with the
agreed rules, and (c) surfacing VIP price/margin in the admin (product edit + supplier invoice).

---

## Proposed work, split by risk

### A. Make the company percentage discount actually work (medium — core pricing)
Apply `organization.discountPercentage` inside the price calculation for the active company.
Today it's dead config; this turns it on. Needs the price engine to know the active
organization (it already flows through checkout — see `CheckoutPage.tsx`).

### B. VIP flag on the company + VIP price on the product (medium — 2 core schema fields)
- `Organization`: add `isVip?: boolean` (one tier; a simple flag, **no new group needed** —
  `groupId` already exists if we ever want tiers later).
- `Product`: add `vipPrice?: number` (integer agorot, optional, back-compat).
> Schema change in `@jsdev_ninja/core` → **version bump + redeploy of all apps & functions**
> using core. Both back-compat (all optional) so legacy docs still validate.

### C. The pricing rule in `getCartCost` (medium-high — the heart of it)
Implement the decision table above as a pure, unit-tested function and call it from
`getCartCost`. Inputs: product (price, discount, vipPrice, purchasePrice), the active
organization (isVip, discountPercentage), VAT settings. Output: final per-item price +
which lever applied (for transparency in admin/debug).
> This is the highest-risk change — it's the money path for **every** order. Must be behind a
> per-store flag and have unit tests for each row of the decision table, incl. the floor clamp.

### D. Admin surfaces (low-medium)
- Product edit (`EditProductPage` / `AddProductPage`): add a **VIP price** field + live
  VIP margin readout (reuse `storeCalculator`).
- Supplier invoice (`AdminInventoryCertificatePage`): add **מחיר VIP** + **% רווח VIP**
  columns to each row, auto-calc from the same purchase price, and include them in the
  old-vs-new confirmation modal + `productsToUpdate` writeback.
- Company edit (`AdminOrganizationsPage` / detail page): a **VIP** toggle next to the existing
  discount % field.

---

## Task breakdown (small, independent PRs)

Per Philip's standing preference: **small, independently-reviewable PRs.** Each behind the
existing per-store gate so nothing changes for other stores until verified.

### Track A — turn on the company discount (no new fields)
- **T1 — Apply `organization.discountPercentage` in `getCartCost`.** Pure function + unit
  tests. The company discount finally subtracts from totals. Behind a per-store flag.

### Track B — VIP data model (each = core schema bump + consumer version update)
- **T2 — `Organization.isVip` flag** + a VIP toggle in company edit/detail UI.
- **T3 — `Product.vipPrice`** + a VIP price field in product add/edit with live VIP margin.
> Each: bump core version + update both consumers (`apps/store`, `functions`) per CLAUDE.md.

### Track C — the pricing rule (depends on T1–T3)
- **T4 — `resolveCompanyPrice()` pure function** implementing the full decision table
  (lower-of, company-discount-not-on-sale, purchase-price floor). Unit-tested per row. No wiring.
- **T5 — Wire T4 into `getCartCost`.** Replace the per-item `finalPrice` with `resolveCompanyPrice`
  when an active VIP company is present. Behind the per-store flag. Verify cart + checkout + admin
  order totals all agree.

### Track D — supplier-invoice VIP columns (depends on T3)
- **T6 — VIP price + VIP profit % columns** in `AdminInventoryCertificatePage` rows, auto-calc
  from purchase price (reuse `storeCalculator`).
- **T7 — Persist VIP price via the invoice writeback.** Extend `SupplierInvoice` row +
  `productsToUpdate` + the create trigger to also write `vipPrice`; show VIP old-vs-new in the
  confirmation modal.

---

## Open decisions for Philip

1. **Field naming / units:** `vipPrice` as integer agorot (consistent with money rule) — OK?
2. **Where the active org reaches `getCartCost`:** confirm the cleanest plumbing (it's already
   available at checkout; need it anywhere else the cart total is computed — e.g. admin
   create-order, side cart).
3. **Floor definition:** clamp at `purchasePrice` exactly, or `purchasePrice` + a configurable
   min-margin %? (Spec assumes exactly purchasePrice.)
4. **Sale detection for rule #2:** "is a sale" = `product.discount.type !== "none"`. Confirm
   that's the right signal (vs. also the bundle/campaign discount engine).
5. **Rollout:** per-store flag (Balasi first) before any wider enablement — assumed yes.

---

## Owner-agreed summary (source of truth for behaviour)

- VIP is **company-level only**, **one tier**, marked by a simple flag.
- Company **percentage discount** is built to actually apply (currently dead).
- Company discount stacks **on top of the VIP price**.
- Between a **site sale** and the **VIP price**, always charge the **lower**.
- When the **site sale** is the lower one, the company discount **does not** stack on it.
- **Never sell below purchase price** (safety floor).
