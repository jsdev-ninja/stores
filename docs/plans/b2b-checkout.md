# Plan: B2B checkout — capture company details & auto-create organization

**Status:** Proposed — needs Philip's approval. Requested by David (owner).
**Trigger:** David provided a redesigned "פרטי המשלוח" (delivery details) checkout mockup
built as a separate HTML prototype. This doc translates that mockup into an implementation
spec so Philip can scope/approve it.

> ⚠️ Owner-restricted feature. Touches the `Order` schema (`@jsdev_ninja/core`) and org
> creation → **cannot ship without developer sign-off** per CLAUDE.md.
> ❌ Net-30 / "שוטף+30" is **not** part of this — the owner does not want it.

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
4. **מועד אספקה ותשלום (Delivery slot & payment)** — date + time slot, payment method
   (credit card + bank transfer only), **PO number**, extra notes.
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
  `PaymentTypeSchema = ["external", "j5", "none"]`. Checkout offers credit card + bank transfer.
  Priority: store → organization → profile (profile strongest).
- A profile already carries `clientType: "user" | "company"` (marked `@deprecated`) and
  `organizationIds[]`. Checkout already blocks if the user belongs to orgs but hasn't picked one
  (`CheckoutPage.tsx:63`).

**Takeaway:** the *data model for B2B orgs largely exists*. The gap is (a) the checkout UI,
(b) a few new order fields, and (c) **auto-create/upsert org from order**.

> ❌ **Net-30 / "שוטף+30" is explicitly out of scope — the owner does not want it at all.**
> Do not add a credit-terms payment type or a net-30 option anywhere.

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

---

## Task breakdown (small, independent PRs)

Per Philip's review on #28: **split into small tasks — no single big PR.** Each row below is
one small, independently-reviewable PR. Order matters only where "depends on" says so; each is
shippable on its own behind the existing `isBalasi` gate.

> **Decisions to lock before T3+** (Philip): (1) auto-create org silently vs. "pending review"?
> (2) dedup key = tax id only, or tax id + name? (3) tax-id collision with an org owned by a
> different user → reject / link / flag?

### Track A — UI (no schema, no payment) — owner-authorizable
- **T1 — Checkout layout redesign (UI only).** ✅ DONE → PR #31 (approved). 5-section mockup,
  every submitted field keeps its existing `name`, new B2B fields are visual-only.
- **T2 — Remove net-30 entirely.** ✅ DONE. Owner does not want "שוטף+30" at all — removed
  from checkout UI and from the public FAQ (#31 / #41). Not a future phase.

### Track B — Persist new order fields (one field-group per PR; each = core schema bump)
Each adds optional fields to `Order` in `@jsdev_ninja/core` (back-compat, all optional) + wires
the matching UI input + shows it read-only in the admin order view. Small and isolated.
- **T3 — `companyName` on order.** Wire the company-name input → persist → show in admin.
- **T4 — `taxId` on order.** Same shape as T3.
- **T5 — `contact { fullName, role, phone, email }` on order.** Contact-person block.
- **T6 — `poNumber` on order.** PO field.
- **T7 — `outOfStockPolicy: "substitute" | "remove"`.** Persist the substitution choice.
> Each T3–T7: 1 core PR (schema) + 1 store PR (wire UI + admin display), or one small PR if
> trivial. Bump core version + update both consumers (`apps/store`, `functions`) per CLAUDE.md.

### Track C — Auto-create organization (depends on T3+T4)
- **T8 — `upsertOrganizationFromOrder` service (no trigger yet).** Pure function: given an order
  with companyName+taxId, find-or-create the tenant-scoped `Organization` (idempotent
  `.create()` by deterministic id from tax id). Unit-tested in isolation. No wiring.
- **T9 — Wire T8 to `order.placed`.** Thin subscriber/trigger calls T8; sets `order.organizationId`.
  Behind a per-store flag so it's off until verified.

> ~~Track D — Net-30 / credit terms~~ — **dropped. Owner does not want net-30.**

---

## Owner's mockup (source of truth for layout/copy)

HTML prototype on David's machine (built separately):
`C:/Users/User/OneDrive/…/Claude/Projects/…store…/index.html` — the 5-section "פרטי המשלוח" modal.
Screenshots are in the chat thread that produced this doc.
