# Plan: B2B checkout — capture company details & auto-create organization

**Status:** Proposed — needs Philip's approval. Requested by David (owner).
**Trigger:** David provided a redesigned "פרטי המשלוח" (delivery details) checkout mockup
built as a separate HTML prototype. This doc translates that mockup into an implementation
spec so Philip can scope/approve it.

> ⚠️ Owner-restricted feature. Touches the `Order` schema (`@jsdev_ninja/core`), payment
> logic, and org creation → **cannot ship without developer sign-off** per CLAUDE.md.

---

## Goal (from owner mockup)

When a customer checks out **as a business**, the checkout form should collect full B2B
details, and the system should **create the customer's organization automatically** from
those details (the question that kicked this off). The mockup has 5 sections:

1. **פרטי לקוח (Customer / company)** — customer-number selector (multiple billing accounts),
   **company name** (required), **ח.פ / עוסק מורשה** (tax id, required), name-on-invoice.
   Plus a banner: *"השלמה אוטומטית מהפעם הקודמת"* — prefill from the last order.
2. **איש קשר (Contact person)** — full name (required), role/title, phone (required), email (required).
3. **כתובת למשלוח (Delivery address)** — street+number, city, floor/entrance, zip, delivery notes.
4. **מועד אספקה ותשלום (Delivery slot & payment)** — date + time slot, payment method incl.
   **"שוטף + 30"** (net-30, *subject to approval*), **PO number**, extra notes.
5. **אם חסר במלאי (Out-of-stock policy)** — substitute with similar (default) vs. remove item;
   terms checkbox, marketing opt-in, order summary.

---

## Current state (confirmed in code)

- **Checkout form** (`apps/store/src/pages/store/CheckoutPage/CheckoutPage.tsx`) collects only:
  `nameOnInvoice`, `clientComment`, `deliveryDate`, `address`, `email`, `phone`
  (`checkoutSchema`, lines 17–24). Company name / tax id are **not** form fields — `companyName`
  is only carried over from an existing profile (`_profile.companyName`, line 99).
- **`Order` schema** (`packages/core/lib/entities/Order.ts`): has `client` (Profile),
  `address`, `nameOnInvoice`, `emailOnInvoice`, `phoneNumberOnInvoice`, `clientComment`,
  `organizationId?`, `billingAccount?`. **No** fields for: contact-person role, PO number,
  out-of-stock policy, tax id at order level (only via profile/org).
- **`Organization` schema** (`packages/core/lib/entities/Organization.ts`): already models a
  B2B customer — `name`, `companyNumber` (tax id), `address`, `paymentType`, `discountPercentage`,
  `billingAccounts[]`, `groupId`. **Organizations are created manually only**, via
  `appApi … createOrganization` from the admin Organizations page. No order-driven creation.
- **Payment types** (`packages/core/lib/entities/Payment/index.ts`):
  `PaymentTypeSchema = ["external", "j5", "none"]`. **There is no "net-30 / שוטף+30" type.**
  Priority: store → organization → profile (profile strongest).
- **Org credit/debt already exists**: `reduceDebtOnTransactionPosted` lowers org debt on
  capture (see `order-approve-flow.md`) — so a credit-terms ("שוטף+30") concept partially
  exists on the org ledger side, just not as a selectable checkout payment method.
- A profile already carries `clientType: "user" | "company"` (marked `@deprecated`) and
  `organizationIds[]`. Checkout already blocks if the user belongs to orgs but hasn't picked one
  (`CheckoutPage.tsx:63`).

**Takeaway:** the *data model for B2B orgs largely exists*. The gap is (a) the checkout UI,
(b) a few new order fields, (c) **auto-create/upsert org from order**, and (d) the **net-30
payment path** — which is the riskiest piece.

---

## Proposed work, split by risk

### A. UI-only (low risk) — owner-approvable on their own
Rebuild the checkout form to the mockup layout (5 sections, RTL, the new copy/labels).
This alone — *without* new persisted fields or auto-org — is a UI/UX change that doesn't
break the API contract. Could ship first as a visual pass.

### B. New order fields (medium — schema change in core)
Add to `Order` (and the checkout schema):
- `companyName` (string), `taxId` / `companyNumber` (string)
- `contact: { fullName, role?, phone, email }`
- `poNumber?` (string)
- `outOfStockPolicy: "substitute" | "remove"`
> Schema change in `@jsdev_ninja/core` → **version bump + redeploy of all apps & functions**
> using core. Backwards-compatible (all-optional) so legacy orders still validate.

### C. Auto-create / upsert organization from order (medium-high)
On order placement, if the buyer supplied company name + tax id and is **not** already linked
to an org:
- **Upsert by tax id** within the tenant (`companyNumber == taxId`, scoped to
  `{companyId}/{storeId}`) — find existing or create a new `Organization`.
- Use **idempotent create** (deterministic id from tax id, `.create()` → treat `ALREADY_EXISTS`
  as no-op) per the backend idempotency rule.
- Link `order.organizationId` + attach/seed a `billingAccount`.
- Backend module: `modules/organizations` (or wherever org lives) — a thin trigger/subscriber
  on `order.placed` calling an `upsertOrganizationFromOrder` service. **Entry point stays thin.**
> **Open decisions for Philip:**
> 1. Auto-create silently, or create as "pending review" for admin confirmation?
> 2. Dedup key — tax id only, or tax id + name?
> 3. What if tax id collides with an existing org owned by a different user?

### D. "שוטף + 30" / net-30 payment method (HIGH risk — needs Philip)
The mockup explicitly gates this: *"כפוף לאישור חברת בלסי… נחזור אליכם לאישור התנאים."*
- Requires a **new payment type** (e.g. extend `PaymentTypeSchema` with `"credit_terms"`),
  which is a core enum change touching order creation, admin charge flow, delivery-note logic,
  and the org debt ledger.
- Needs an **approval gate**: order can't be auto-confirmed on net-30 — it parks for admin
  approval of the customer's credit terms before fulfilment.
- This is real financial logic (issuing credit to a business). **Should be its own phase**,
  not bundled with the UI work.

---

## Suggested phasing

1. **Phase 1 (UI):** rebuild checkout to the mockup, fields B persisted as optional. Low risk,
   visible win, no payment changes. Net-30 option shown but **disabled / "coming soon"** or
   routed to manual contact.
2. **Phase 2 (auto-org):** upsert organization from order (section C) once decisions above are made.
3. **Phase 3 (net-30):** credit-terms payment type + approval gate (section D) — separate review.

---

## Owner's mockup (source of truth for layout/copy)

HTML prototype on David's machine (built separately):
`C:/Users/User/OneDrive/…/Claude/Projects/…store…/index.html` — the 5-section "פרטי המשלוח" modal.
Screenshots are in the chat thread that produced this doc.
