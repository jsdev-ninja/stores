# Approval request: persist B2B fields on the Order (Track B / T3–T7)

**Status:** Needs Philip's approval. Requested by David (owner) — "I want the fields to actually save."
**Parent plan:** `docs/plans/b2b-checkout.md` (PR #28). UI shipped in PR #31 (T1–T2, approved).
**Scope of THIS doc:** persistence only — make the new checkout fields save on the order and show
in the admin order view. **No org auto-creation (Track C). No net-30 (Track D).** Those stay separate.

---

## Why this needs approval

Saving these fields means adding fields to the **`Order` entity in `@jsdev_ninja/core`** — a
core-schema change (owner-restricted per CLAUDE.md). Today the checkout shows company name / tax id /
PO as **visual-only** inputs (PR #31) because there is nowhere on the order to store them.

## Current state (confirmed)

- `Order` (`packages/core/lib/entities/Order.ts`) has `client` (Profile), `address`,
  `nameOnInvoice`, `clientComment`, `organizationId?`, `billingAccount?`. **No** fields for
  company name, tax id, contact-person/role, PO, or out-of-stock policy.
- `Profile` has `companyName?` and a deprecated `clientType`, but checkout's `onSubmit`
  builds `client` from a **precomputed `_profile`**, so form edits to `client.*` are not the
  intended persistence path for these new B2B values. Explicit order-level fields are cleaner.

## Proposed change (small, back-compat)

### 1. Core schema — add to `OrderSchema` (ALL optional → existing orders still valid)
```ts
// B2B buyer details (optional)
companyName: z.string().optional(),
taxId: z.string().optional(),               // ח.פ / עוסק מורשה
contact: z
  .object({
    fullName: z.string().optional(),
    role: z.string().optional(),            // תפקיד
    phone: z.string().optional(),
    email: z.string().email().optional(),
  })
  .optional(),
poNumber: z.string().optional(),            // הזמנת רכש
outOfStockPolicy: z.enum(["substitute", "remove"]).optional(),
```
- Bump `@jsdev_ninja/core` version; update the dependency in `apps/store/package.json` **and**
  `functions/package.json` to the exact new version (per CLAUDE.md).

### 2. Store — wire the inputs
- Add these names to `checkoutSchema` (all optional) in `CheckoutPage.tsx`.
- In `BalasiCheckoutLayout.tsx`, convert the visual-only inputs (company name, tax id, role, PO,
  out-of-stock radios) into real `Form` fields with the names above.
- In `onSubmit`, copy the values onto `newOrder`. No change to payment flow.

### 3. Admin — show them
- Display the new fields (read-only) on the admin order detail view.

## Suggested PR split (per your "small tasks" note)
- **T3** companyName · **T4** taxId · **T5** contact{} · **T6** poNumber · **T7** outOfStockPolicy.
- Could also be **one small "B2B order fields" PR** (single core bump) if you prefer fewer bumps —
  your call.

## Risk
- **Low.** Additive, all-optional fields; no change to existing fields, payment, or order flow.
  Old orders/clients keep validating. The only cross-cutting bit is the core version bump +
  the two consumer updates.

## What I need from you
1. ✅/❌ to add these fields to the `Order` schema.
2. Preference: **one** "B2B order fields" PR, or **five** (T3–T7 separately)?
3. Field-name/shape tweaks (e.g. `taxId` vs `companyNumber` to match `Organization.companyNumber`).

> Note: aligning `taxId` here with `Organization.companyNumber` now makes the later auto-create-org
> work (Track C) a clean join. Flagging so we pick the name once.
