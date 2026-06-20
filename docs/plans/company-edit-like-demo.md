# Plan: Company edit "like the demo" — full tabbed management

**Status:** Proposed — needs Philip's approval. Requested by David (owner).
**Trigger:** David reviewed how editing a company works in the Balasi admin demo
(`demo/balasi-store-site-2026-06-12/admin.html` + `admin.js`) and asked to make our
company editing identical — **all of it** ("4 הכל").

> ⚠️ Owner-restricted feature. Touches the `Organization` schema in `@jsdev_ninja/core`,
> the org create/update backend, and replaces/extends an existing edit screen →
> **cannot ship without developer sign-off** per CLAUDE.md.

---

## What the demo does

In the demo, the row "עריכה" button opens **one modal with 4 tabs**, all fully editable
(`admin.js` `openCompanyModal` line ~3942):

1. **פרטי חברה** (`renderCompanyDetailsTab`, ~3982) — name*, taxId*, **phone**, **email**,
   address, city (dropdown), **zip**, **notes** (textarea), and a **"פטור מדמי משלוח"**
   (`freeShipping`) checkbox.
2. **🏢 סניפים** (`renderCompanyBranchesTab` + `editBranch`/`saveBranch`/`deleteBranch`,
   ~4014) — full CRUD on branches. Each branch: `label*`, `address`, `phone`, `isPrimary`.
   Exactly one primary; can't delete the last one.
3. **💳 חשבונות** (`renderCompanyAccountsTab` + `editAccount`/`saveAccount`/`deleteAccount`,
   ~4093) — full CRUD on billing accounts. Each account: `label*`, `customerNumber*`,
   `payTerms` (credit / net30), `creditLimit`, `isPrimary`, plus optional
   **category restriction** (`restricted` + `allowedCategories[]`).
4. **👥 משתמשים מורשים** (`renderCompanyUsersTab`, ~4232) — list + manage the contacts
   authorized to order for the company, each with an access list (branch + account + role:
   orderer / approver / viewer).

The "חברה חדשה" path seeds a default branch + a default account automatically
(`saveCompany`, ~4272).

## Current state in our app (confirmed in code)

- **List page:** `apps/store/src/pages/admin/AdminOrganizationsPage.tsx`.
  - There is **already** a `CompanyModal` (line ~159) with the same 4 tabs and the same
    visual style (shipped in [stores#68](https://github.com/jsdev-ninja/stores/pull/68),
    layout-only).
  - **BUT** the modal only opens for **"חברה חדשה"**. The row **"עריכה"** button
    (line ~1190) navigates to a **different, older screen**
    `AdminOrganizationDetailPage` (tabs: פרטים / הזמנות / חשבוניות / פעולות) — which has
    richer management (orders, invoices, action history) the modal does **not** have.
  - In the modal: **סניפים** and **משתמשים** tabs are empty placeholders; **חשבונות**
    is **read-only** (no add/edit/delete).
  - Details tab is **missing** these demo fields: phone, email, zip, notes, freeShipping.
- **Core schema** (`packages/core/lib/entities/Organization.ts`) — minimal:
  ```
  OrganizationSchema = { id, name, discountPercentage?, nameOnInvoice?,
                         billingAccounts[], paymentType, companyNumber?, address?, groupId? }
  BillingAccountSchema = { number, name, id }   // no payTerms / creditLimit / primary / restriction
  ```
  No `branches`, no contact fields (phone/email/zip/notes), no `freeShipping`, and the
  account schema is far thinner than the demo's.
- **Backend:** `appApi.admin.createOrganization` / `updateOrganization` persist only the
  current shape.

## Gap → work required

| Demo capability | Needs |
| --- | --- |
| Details: phone, email, zip, notes, freeShipping | **Core schema change** (`OrganizationSchema`) + UI fields + save wiring |
| Branches CRUD | **New `BranchSchema` in core** + UI + backend persist |
| Accounts CRUD (payTerms, creditLimit, primary, category restriction) | **Extend `BillingAccountSchema`** + UI + backend persist |
| Users/authorized-contacts management | Overlaps the existing **B2B users/access** spec ([stores#50](https://github.com/jsdev-ninja/stores/pull/50)) — reuse, don't duplicate |
| "עריכה" opens the modal instead of the detail page | Wiring change — **but** must not drop the detail page's orders/invoices/actions (regression). Decide: embed those into the modal, or keep both. |

## Open decisions for Philip

1. **Schema ownership** — `branches` and the richer `billingAccounts` live on
   `Organization` in `@jsdev_ninja/core`. Confirm shape + version bump + update both
   consumers (`apps/store`, `functions`).
2. **payTerms — DECIDED (David):** Include configurable payment terms on the account
   (שוטף+30, שוטף+15, אשראי/מזומן, etc.). **Admin-only** — this is a field the admin
   (David) sets and sees on the company/account; **the customer must NOT see or choose
   payment terms anywhere** (not in checkout, not in their profile). It is purely an
   internal billing attribute. (This refines the earlier "no net30" note in
   `b2b-checkout.md`: net terms ARE wanted now, but strictly admin-side.) Open sub-question
   for Philip: fixed list vs. free-form day count.
3. **Category restriction on accounts — DECIDED (David):** Include it. The admin can
   optionally toggle "הגבל חשבון לקטגוריות" per account and pick allowed categories
   (demo `editAccount` `restricted` + `allowedCategories`). Note for Philip: this implies
   **enforcement at order time** (block/route disallowed items) — needs a decision on how
   strict and where it's enforced, beyond the editing UI.
4. **Edit entry point** — replace the detail-page navigation with the modal, or open the
   modal from the row and keep the detail page reachable for orders/invoices/history?
   (Pure replacement = regression on existing management.)
5. **Migration** — existing orgs have no branches/contact fields. Backfill a default
   "primary branch" from `address`, like the demo does on open? Read-time tolerant.

## Suggested phasing (low-risk first)

1. **Phase 1 (smallest, owner-safe-ish):** add the missing **details fields**
   (phone/email/zip/notes/freeShipping) to the modal + schema, and make **"עריכה"** open
   the modal — *only if* we keep the detail page reachable so nothing is lost.
2. **Phase 2:** Accounts CRUD (extend `BillingAccountSchema`).
3. **Phase 3:** Branches CRUD (new `BranchSchema`).
4. **Phase 4:** Users/authorized contacts — fold in via the existing #50 spec.

Each phase is an independent schema bump + PR.

## Files involved

- `packages/core/lib/entities/Organization.ts` — schema
- `apps/store/src/pages/admin/AdminOrganizationsPage.tsx` — modal + row actions
- `apps/store/src/pages/admin/AdminOrganizationDetailPage/AdminOrganizationDetailPage.tsx`
  — existing edit screen (regression surface)
- `functions/` — `createOrganization` / `updateOrganization` endpoints
- Reference: `demo/balasi-store-site-2026-06-12/admin.js` (`openCompanyModal` and the
  `renderCompany*Tab` / `save*` functions)
