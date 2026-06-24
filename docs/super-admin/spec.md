# Super-Admin Console — Product Spec (v1)

**Status:** Approved — v1 scope locked (2026-06-19)
**Author:** Product (for Philip)
**Date:** 2026-06-19
**Audience:** One internal user — Philip (platform developer/owner). God-mode internal tool, not customer-facing.

---

## 0. Decisions locked (2026-06-19) — gate approved

Resolved at the PM gate by Philip; these **override** the open questions in §8:

- **O-1 — Write set:** ✅ **E1 (order status) + E2 (product visibility) + E3 (product stock)**. No other curated writes in v1.
- **O-2 — Order-status semantics:** **bare field set**, exactly like `change-order-status.ts`. No refund/invoice/payment side-effects, no transition guard. Validate only that the target is a real `Order.status` enum value.
- **O-3 — Price & settings:** **E4 (price) deferred to phase 2.** **E5 (settings field) deferred** — no settings editing in v1 (settings stays view-only at most, P1 read).
- **O-4 — Store selection:** **global store-switcher** with a persistent "current store" banner.
- **O-5 — Audit:** **separate, browsable audit log** — one record per super-admin edit capturing who / entity / field / old→new / when — in addition to any `updatedBy`/`updatedAt` stamping on the record.
- **O-6 — P0 collections:** **Orders, Products, Profiles** (confirmed).
- **O-7 — Edge auth/gating:** **left to the architect** (Firebase Auth on the same `jsdev-stores-prod` project; only the `superAdmin` claim admitted).

Prerequisite unchanged — **A1:** the `superAdmin` claim must be manually bootstrapped via the Admin SDK before the console is usable.

---

## 1. Problem & context

Philip operates a multi-tenant store platform (`jsdev-stores-prod`, region `europe-west1`) where every store's data lives at `{companyId}/{storeId}/{collection}`. To investigate a customer complaint, fix a stuck order, or check a setting **for a specific store**, he currently has to:

- Open the **Firebase console**, navigate the Firestore tree by hand to the right `companyId/storeId/...` path, and read raw JSON with no entity-aware formatting.
- Drop to a **terminal with production ADC** and run one-off ops scripts. This already exists today — `functions/scripts/change-order-status.ts` is a hand-rolled CLI that authenticates against prod, does a collection-group lookup, prints the order, and flips `status`. It works, but it's slow, terminal-only, easy to point at the wrong order, and every new "safe" mutation means writing another script.
- Bounce between consoles (Firebase / gcloud) to assemble a full picture of one store.

**Why an in-house tool wins.** The platform already has the entity schemas (Zod, in `@jsdev_ninja/core`), the tenant-path helper (`FirebaseAPI.firestore.getPath`), and a `superAdmin` claim in the token type. A purpose-built console can render each entity the way the app understands it, enforce tenant scoping correctly, and replace the most common terminal scripts with reviewed, one-click safe actions — so Philip stops context-switching between consoles and stops writing throwaway mutation scripts.

The v1 ambition is deliberately narrow: **a cross-store Firestore data browser with a small set of curated, safe write actions.** It is the foundation the later phases (logs, claims, secrets) attach to — not all of it at once.

---

## 2. Goals / Non-goals

### Goals (v1)

- **G1 — One place to read any store's data.** Pick any store from a list; browse that store's core collections with entity-aware rendering (not raw JSON).
- **G2 — Replace the common Firebase-console read paths.** Investigating "what happened with this order / this customer / this org" should not require the Firebase console.
- **G3 — Replace the highest-frequency ops scripts with curated safe actions.** Most notably, change an order's status from the UI instead of running `change-order-status.ts`.
- **G4 — Be safe by construction.** Writes are limited to a reviewed shortlist of operations, each tenant-scoped and `superAdmin`-verified server-side. No raw "edit any document" field.

### Non-goals (v1) — explicitly deferred

These are **out of scope for v1** and are addressed only in the Phasing section, not specified here:

- **Auth users & custom-claims management** — no UI to create users, reset passwords, or set/clear claims. (Setting the `superAdmin` claim is a one-time manual prerequisite — see Assumptions.)
- **Cloud Function logs / error monitoring** — no log viewer, no error dashboards.
- **Store secrets / credentials management** — no reading or editing `STORES/{storeId}/private/*` (payment-gateway keys, etc.).
- **Anything gcloud / IAM / billing / hosting** — no infra control.
- **Raw arbitrary Firestore document editing** — explicitly rejected by the curated-edit decision. v1 reads everything, but writes only the shortlist.
- **Creating or deleting whole documents** (new orders, deleting a product, etc.) — v1 mutates fields on existing docs only. No creates, no deletes.
- **Bulk / cross-store batch operations** — every action targets a single record in a single store.
- **Editing money/ledger data** — the A/R ledger (`organizationBalance`) is append-only with a derived rollup; it is **view-only** in v1 (see §4).

---

## 3. V1 user stories / jobs-to-be-done

Grounded in the real entities in `@jsdev_ninja/core` and the collections in `storeCollections`.

### Store selection / switching

- **US-1.** As super-admin, I see a **list of all stores** (enumerated from the root `STORES` collection, the pattern nightly jobs already use) showing store name, `storeId`, `companyId`, and primary URL, so I can find the store I need to work on.
- **US-2.** As super-admin, I **select a store** and from then on every browse/search is scoped to that store's `{companyId}/{storeId}`, so I can't accidentally read or edit another tenant's data. A persistent indicator shows which store I'm "inside."
- **US-3.** As super-admin, I can **switch stores** without losing my place in the navigation (e.g. stay on the Orders view, just for a different store).

> Open question O-4 covers whether selection is a global store-switcher or a picker per view. Default assumption: a global switcher with a clear "current store" banner.

### Browsing collections (read)

For v1, the collections worth browsing — ranked by how often they're needed for support/ops — are:

| Priority | Collection | Entity | Why it's needed |
| --- | --- | --- | --- |
| **P0** | `orders` | `Order` | The #1 support/ops object. Investigate complaints, stuck payments, wrong status. |
| **P0** | `products` | `Product` | Check/fix stock, price, publish state. |
| **P0** | `profiles` | `Profile` | Look up a customer (email/phone/displayName) to tie to their orders. |
| **P1** | `organizations` | `Organization` | B2B buyers — discount %, billing accounts, payment type. |
| **P1** | `settings` | store settings | "Why is this store behaving like this?" config checks. |
| **P1** | `organizationBalance` / `organizationBalanceRollup` | A/R ledger + rollup | See what a B2B org owes (view-only). |
| **P2** | `invoices`, `suppliers`, `supplierInvoices`, `discounts`, `categories`, `paymentLinks`, `transactions` | various | Occasional deep investigations. |

- **US-4.** As super-admin, I select **Orders** for the current store and see a **list of recent orders** (most recent first) with the at-a-glance fields: `id`, `date`, `status`, `paymentStatus`, customer name, total, so I can spot the one a customer is asking about.
- **US-5.** As super-admin, I open a **single order** and see it rendered as a readable record — status, payment status/type, the cart line items, delivery date/address, B2B fields (companyName/PO/contact) when present, and the audit fields (`updatedBy` / `updatedAt`) — so I understand the full state without parsing JSON.
- **US-6.** As super-admin, I select **Products** and can find a product by name/SKU to check its `price`, `isPublished`, and `stock`.
- **US-7.** As super-admin, I select **Customers (profiles)** and search by email / phone / displayName to find a customer, then see their key fields and (nice-to-have) jump to their orders.
- **US-8.** As super-admin, viewing any record, I can see the **full raw document** (read-only JSON) as a fallback, so nothing is ever hidden from me even if the pretty view doesn't render a field.

### Search / filter (read)

- **US-9.** As super-admin, within the current store I can **filter Orders by status** and find an order **by id**, so I can narrow a long list quickly. (Other filters are P2.)
- **US-10.** As super-admin, I can **find a product by name or SKU**, and **find a customer by email/phone**, within the current store.

> v1 search is **per-store, server-side, simple field matching** — not the customer-facing Algolia experience. If a view reaches for Algolia, the tenant filter rule (`storeId AND companyId`) is mandatory.

### Curated edits (write) — see §4 for the full operation list

- **US-11.** As super-admin, from a single order I can **change its status** to a valid next status, the change is `superAdmin`-verified server-side, the order's `updatedBy`/`updatedAt` are stamped, and I see confirmation — replacing the `change-order-status.ts` script.
- **US-12.** As super-admin, from a single product I can **toggle its published state** and **adjust its stock quantity**, so I can quickly hide a mispriced item or fix stock without the Firebase console.

---

## 4. Proposed curated edit operations for v1

This is the heart of the "curated, not god-mode" decision. v1 **reads everything** across stores, but **writes only this reviewed shortlist**. Every operation is tenant-scoped, `superAdmin`-verified server-side, and (recommended) audit-stamped.

Risk legend: **Low** = reversible, no downstream side effects, hard to get wrong. **Medium** = reversible but has downstream effects or coupling. **High** = touches money/integrity/external systems → recommend deferring.

### Recommended IN for v1

| # | Operation | Entity / field | Why it's safe & needed | Risk |
| --- | --- | --- | --- | --- |
| **E1** | **Change order status** | `Order.status` (enum: draft → pending → processing → in_delivery → delivered / cancelled / completed / refunded) | Directly replaces the existing `change-order-status.ts` script — the proven, most-common ops mutation. Single enum field, reversible. | **Low–Medium** (see note) |
| **E2** | **Toggle product visibility** | `Product.isPublished` (boolean) | One boolean; instantly reversible. Lets Philip pull a mispriced/wrong product from the storefront immediately. | **Low** |
| **E3** | **Adjust product stock quantity** | `Product.stock.quantity` (number ≥ 0) | Common correction; reversible; constrained to ≥ 0 by schema. | **Low** |

**Note on E1 risk.** `status` is a single enum and the script already does this, so the *mechanism* is low-risk. But status changes may have **downstream coupling** (e.g. payment/invoice/ledger flows keyed off status transitions). v1 should treat E1 as "set the field," matching what the script does today — it must **not** silently trigger refunds, invoicing, or payment captures. Whether certain transitions should be blocked or warned is **Open Question O-2**.

### Recommended IN — only if quick, otherwise defer

| # | Operation | Entity / field | Why | Risk |
| --- | --- | --- | --- | --- |
| **E4** | **Edit product price** | `Product.price` (positive number, agorot) | Frequently the actual reason to touch a product. But price changes interact with discounts, VAT, and may need to propagate to the search index (Algolia) to match the storefront. Recommend **deferring to phase 2** unless index propagation is trivial — a price that's right in Firestore but stale in Algolia is a confusing half-fix. | **Medium** |
| **E5** | **Edit a single store setting field** | a specific, named `settings` field (TBD) | The user's brief names "edit a single setting field." Settings is a broad bag; editing it safely means picking *specific* low-risk fields, not a generic editor. Needs Philip to name which fields (**O-1**). Defer the generic case; a named field or two could come in if specified. | **Medium** |

### Recommended OUT for v1 (defer) — with reasoning

| Operation | Why it's deferred |
| --- | --- |
| **Edit order cart / amounts / line items** | Touches money and totals; high blast radius; can desync invoice/ledger. View-only in v1. |
| **Record/trigger payments, refunds, invoicing** | External systems (HYP, EZcount) + ledger side effects. Not a "field edit." Out. |
| **Edit anything in `organizationBalance` / rollup** | Append-only ledger with a **derived rollup cache** (`owed`/`credit`/`totalAccrued`/`totalSettled`). A direct edit corrupts the invariant. **View-only, never a curated edit in v1.** |
| **Edit `Organization.discountPercentage` / billing accounts** | Affects every future order's pricing for that buyer; B2B-sensitive. Defer. |
| **Edit customer (`Profile`) identity fields** (email, phone) | Auth/identity coupling; phishing/lockout risk. Defer to the claims/users phase. |
| **Edit `Discount`, `Supplier`, `Invoice`, `DeliveryNote` records** | Either money-adjacent or low-frequency; not worth the v1 surface. View-only. |
| **Delete / create any document** | Out of scope by the v1 "field edits on existing docs only" rule. |

**Opinion:** ship v1 with **E1, E2, E3** as the curated write set. They cover the real daily pain (stuck orders, hide-a-product, fix-stock), each is a single constrained field, and E1 has a proven precedent. Hold **E4 (price)** and **E5 (settings field)** pending Philip's answers on index propagation and which exact setting fields matter (O-1, O-3).

---

## 5. Priority / phasing

### Smallest useful v1 (the line to ship)

1. **Store list + select/switch** with a persistent "current store" indicator (US-1–3).
2. **Read** the P0 collections — **Orders, Products, Profiles** — as a list + single-record view, with the raw-JSON fallback (US-4–8).
3. **Per-store search/filter** for those three (US-9–10).
4. **Curated writes E1, E2, E3** with server-side `superAdmin` verification and audit stamping (US-11–12).

That is the MVP: it kills the two biggest daily annoyances (Firebase-console order spelunking + the order-status script) and nothing more.

### Phase 1.5 (fast follow, same app)

- Add P1 read collections: **organizations, settings, organizationBalance** (view-only).
- Decide and add **E4 (price)** and/or **E5 (named setting field)** based on O-1/O-3.
- An **audit log view** of curated edits (if O-5 says we want one).

### Phase 2+ (separate specs, not now)

- **Auth users & custom-claims management** (incl. a UI to grant `superAdmin` / per-store admin — removes the manual bootstrap).
- **Cloud Function logs & error monitoring.**
- **Store secrets / credentials** management.
- Anything **gcloud / IAM / billing / hosting**.
- Cross-store / bulk operations and richer search.

---

## 6. Success criteria / acceptance

v1 is "done and good" when:

- **AC-1.** From the super-admin app, Philip can list all stores and enter any one of them, scoped to its `{companyId}/{storeId}`.
- **AC-2.** For a selected store he can browse and open individual **Orders, Products, and Profiles**, rendered readably, with a raw-JSON fallback — without opening the Firebase console.
- **AC-3.** He can find an order by id/status, a product by name/SKU, and a customer by email/phone, within the current store.
- **AC-4.** He can perform **E1 (order status), E2 (product visibility), E3 (product stock)** from the UI; each write is `superAdmin`-verified server-side, tenant-scoped, validated against the entity schema, and stamps `updatedBy`/`updated`-style audit fields where the entity supports them.
- **AC-5.** The console can do **none** of the deferred actions — no claims, no logs, no secrets, no infra, no raw arbitrary edits, no creates/deletes. (Negative acceptance — the absence is the safety guarantee.)
- **AC-6.** The order-status curated action makes `functions/scripts/change-order-status.ts` redundant for normal use (the script can remain as a break-glass fallback).
- **AC-7.** A wrong/forged token without the `superAdmin` claim cannot read or write **any** store's data through the new endpoints.

**Outcome metric (informal, single-user tool):** the number of times Philip opens the Firebase console or runs an ops script for these P0 tasks drops to ~zero within a week of shipping. There's no analytics product to instrument here — success is Philip's own "I stopped jumping between consoles."

---

## 7. Risks & assumptions

### Lead risk — cross-tenant auth (the core technical constraint)

- **R1 (critical).** Every existing backend function derives the tenant (`companyId`/`storeId`) from the **caller's token**, and a normal user's claims hold a **single** store tuple. Cross-store access therefore **cannot** reuse existing endpoints. v1 needs **new admin-scoped callable endpoints** that (a) accept an **explicit** `companyId` + `storeId`, (b) **verify the `superAdmin` claim server-side** before any read/write, and (c) scope all Firestore access via `FirebaseAPI.firestore.getPath(...)`. This is the single biggest design decision for the architect and the foundation of AC-7. *(How to build these is the architect's call — this spec only asserts they're required.)*

### Dependency / assumption — claim bootstrap

- **A1 (prerequisite).** **No code currently sets custom claims** (todo.md: "add super admin for every store"). So the super-admin user's `superAdmin` claim must be **bootstrapped manually** via the Firebase Admin SDK as a **v1 prerequisite**. Building a claims-management UI is explicitly out of scope (phase 2), but without this one-time manual grant, the whole console is inaccessible. **This must happen before v1 is usable.**

### Other assumptions

- **A2.** A **brand-new separate app at `apps/super-admin`** (own Firebase Hosting target + deploy) is the agreed placement — god-mode code and any secrets must not ship in the customer store frontend bundle. (Decision already made.)
- **A3.** Stores can be reliably **enumerated from the root `STORES` collection** (confirmed — nightly jobs like `reconcileProjectionsSchedule` already do this).
- **A4.** The entity Zod schemas in `@jsdev_ninja/core` are the **source of truth** for both rendering and write-validation; curated writes validate against them server-side.
- **A5.** This is a **single-user** tool. We are **not** building multi-admin roles, per-store-scoped admins, approval workflows, or rate limiting in v1.

### Other risks

- **R2.** **Money/ledger integrity.** The A/R ledger is append-only with a derived rollup; the Order carries invoice/payment state. Mitigation: all money/ledger data is **view-only** in v1; curated writes are limited to non-money fields (status, visibility, stock).
- **R3.** **Order-status side effects.** A status change might be expected (by Philip or by downstream flows) to trigger refunds/invoicing. v1 deliberately does a **bare field set** (matching the script). Mitigation + decision needed: **O-2**.
- **R4.** **Stale search index after edits.** Editing `price`/`isPublished`/`stock` in Firestore without updating Algolia could make the storefront disagree with the console. Mitigation: this is partly why **E4 (price) is held**; for E2/E3 the architect should confirm whether storefront reads come from Firestore or the index. *(Flagged for architect; not resolved here.)*
- **R5.** **Blast radius of a bug in an admin endpoint.** Because these endpoints can touch any tenant, a scoping bug is a cross-tenant data leak (the platform's stated critical-bug class). Mitigation: mandatory `superAdmin` check + `getPath` scoping + (recommended) audit log. Security review required before deploy.

---

## 8. Open questions for Philip

These are the decisions only Philip can make — answers may shift §4 and §5.

- **O-1 — Curated write set sign-off.** Do you approve **E1 (order status), E2 (product visibility), E3 (product stock)** as the v1 write set? Anything you'd add or pull?
- **O-2 — Order-status semantics.** When you change an order's status, should it ever be **just a field set** (like the current script), or do you expect certain transitions to **trigger** downstream actions (refund, invoice, payment capture) — or be **blocked/warned** (e.g. can't jump `draft → completed`)? Default v1 = bare field set, no side effects.
- **O-3 — Settings & price.** (a) Is **E5 (editing a store setting field)** needed in v1, and if so **which specific fields**? (b) Is **E4 (product price)** v1 or phase 2 — and do storefront prices read from Firestore or Algolia (i.e. would a Firestore price edit show up immediately)?
- **O-4 — Store selection UX.** Global **store-switcher** with a persistent "current store" banner, or a **store picker per view**? Default = global switcher.
- **O-5 — Audit logging expectation.** For curated edits, is stamping `updatedBy`/`updatedAt` on the record **enough**, or do you want a **separate audit log** ("who changed what, when, old→new") you can browse? (The Order entity already has the `updatedBy`/`updatedAt` convention; a dedicated log would be additional.)
- **O-6 — First collections.** Confirm the P0 set is **Orders, Products, Profiles**. Is there anything you reach for often enough that it should be P0 instead of P1 (e.g. `organizations`, `settings`)?
- **O-7 — Hosting/auth boundary.** Any preference on how the separate `apps/super-admin` is gated at the edge (e.g. its own Firebase Auth sign-in reusing the same project), or leave entirely to the architect?

---

## Appendix — entities referenced (from `@jsdev_ninja/core`)

`Order` (8-status enum + separate `paymentStatus`, cart, invoice/ledger refs, `updatedBy`/`updatedAt` audit fields) · `Product` (`isPublished`, `price`, `stock.quantity`) · `Profile` (customer: email/phone/displayName/orgIds) · `Organization` (B2B: `discountPercentage`, billing accounts) · `Store` (metadata under root `STORES`) · `OrganizationBalance`/`Rollup` (append-only A/R ledger + derived rollup) · plus `Category`, `Invoice`, `DeliveryNote`, `Supplier`, `Discount`, `Budget`, `Payment`.
